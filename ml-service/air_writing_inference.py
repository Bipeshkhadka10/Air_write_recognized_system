import cv2
import numpy as np
import os
import json
import types
from collections import deque

from google.protobuf import message_factory, symbol_database

_symbol_db = symbol_database.Default()
if not hasattr(_symbol_db, "GetPrototype") and hasattr(message_factory, "GetMessageClass"):
    def _get_prototype(descriptor):
        return message_factory.GetMessageClass(descriptor)

    setattr(_symbol_db, "GetPrototype", _get_prototype)

if not hasattr(message_factory.MessageFactory, "GetPrototype") and hasattr(message_factory, "GetMessageClass"):
    def _message_factory_get_prototype(self, descriptor):
        return message_factory.GetMessageClass(descriptor)

    setattr(message_factory.MessageFactory, "GetPrototype", _message_factory_get_prototype)

import mediapipe as mp

try:
    import tensorflow as tf
except ModuleNotFoundError as exc:
    raise ModuleNotFoundError(
        "TensorFlow is not installed in the Python interpreter that launched this script. "
        "Activate the project virtual environment and run: d:/Downloads/Bipesh/.venv/Scripts/python.exe air_writing_inference.py"
    ) from exc

if not hasattr(mp, "solutions"):
    from mediapipe.python import solutions as mp_solutions

    mp = types.SimpleNamespace(solutions=mp_solutions)

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
MODEL_KERAS_PATH = "air_write_cnn.keras"
MODEL_H5_PATH = "air_write_cnn.h5"
MODEL_TFLITE_PATH = "air_write_model.tflite"
MODEL_SAVEDMODEL_PATH = "air_write_saved_model"
CLASS_MAP_PATH = "class_indices.json"
IMG_SIZE     = (64, 64)
CANVAS_ALPHA = 0.6          # Transparency of stroke overlay
STROKE_COLOR = (255, 255, 0)  # Cyan in BGR — matches your training dataset exactly
STROKE_THICK = 4
SMOOTHING    = 7            # Moving average smoothing for finger jitter

# Camera/canvas geometry controls
USE_SQUARE_DRAW_REGION = True          # Keep writing area square, not full-width horizontal.
CAMERA_MIRROR = True                    # Selfie-style mirrored preview and mirrored drawing coordinates.
MODEL_EXPECTS_MIRRORED_STROKE = False   # Training uses non-mirrored characters; flip live canvas before inference.
FLIP_STROKE_FOR_MODEL = (MODEL_EXPECTS_MIRRORED_STROKE != CAMERA_MIRROR)
AUTO_SELECT_STROKE_ORIENTATION = True   # Try both orientations and use the stronger prediction.

# Stroke stability controls
MIN_MOVE_PX = 2             # Ignore tiny jitter moves
MAX_JUMP_PX = 110           # Ignore sudden large tracking jumps
START_STABLE_FRAMES = 2     # Frames required before entering WRITING
STOP_STABLE_FRAMES = 4      # Frames required before STOP recognition
HOVER_STABLE_FRAMES = 2     # Frames required before hover/reposition mode
CLEAR_STABLE_FRAMES = 4     # Frames required before clear gesture trigger

# Prediction quality controls
MIN_STROKE_PATH_PX = 70.0   # Require enough drawn path before prediction
MIN_INK_PIXELS = 120        # Require minimum foreground pixels on canvas
MIN_ACCEPT_CONFIDENCE = 0.65  # Below this, prediction is marked uncertain
USE_TTA_PREDICTION = True
TTA_PIXEL_SHIFTS = ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1))
DEBUG_SAVE_PREPROCESS = False
DEBUG_PREPROCESS_PATH = "debug_preprocess.png"

# Distance-ratio thresholds used for orientation-invariant finger states.
EXTEND_RATIO = 1.08
FOLD_RATIO = 0.95

# Fallback class labels if class mapping file is missing.
CLASS_NAMES = [str(d) for d in range(10)] + [chr(c) for c in range(65, 91)]


def load_class_names(path: str = CLASS_MAP_PATH):
    """Load index->class mapping saved during training."""
    if not os.path.exists(path):
        print(f"[WARN] Mapping file not found: {path}. Using fallback labels.")
        return CLASS_NAMES

    try:
        with open(path, "r", encoding="utf-8") as f:
            payload = json.load(f)
        names = payload.get("index_to_class", [])
        if not isinstance(names, list) or not names:
            raise ValueError("index_to_class missing or invalid")
        print(f"[INFO] Loaded class mapping from {path}")
        return names
    except Exception as exc:
        print(f"[WARN] Could not read class mapping ({exc}). Using fallback labels.")
        return CLASS_NAMES


class ModelRunner:
    """Unified predictor wrapper for Keras and TFLite models."""

    def __init__(self, backend_name, model_path, input_size, input_channels, output_dim, predict_fn):
        self.backend_name = backend_name
        self.model_path = model_path
        self.input_size = input_size
        self.input_channels = input_channels
        self.output_dim = output_dim
        self._predict_fn = predict_fn

    def predict(self, batch):
        return self._predict_fn(batch)


def _adapt_channels(batch: np.ndarray, expected_channels: int) -> np.ndarray:
    """Match the model's expected channel count without changing stroke geometry."""
    if batch.ndim != 4:
        raise ValueError(f"Expected rank-4 batch, got shape {batch.shape}")

    current_channels = batch.shape[-1]
    if current_channels == expected_channels:
        return batch
    if current_channels == 1 and expected_channels == 3:
        return np.repeat(batch, 3, axis=-1)
    if current_channels == 3 and expected_channels == 1:
        return np.max(batch, axis=-1, keepdims=True)

    raise ValueError(
        f"Unsupported channel conversion: {current_channels} -> {expected_channels}"
    )


def _resize_spatial(batch: np.ndarray, target_h: int, target_w: int) -> np.ndarray:
    """Resize batch spatial dimensions if they differ from model input size."""
    if batch.shape[1] == target_h and batch.shape[2] == target_w:
        return batch

    resized = tf.image.resize(batch, [target_h, target_w], method="area")
    return resized.numpy().astype(np.float32)


def _quantize_tensor(values: np.ndarray, scale: float, zero_point: int, dtype) -> np.ndarray:
    """Quantize float input to match integer TFLite model input tensors."""
    if scale <= 0:
        return values.astype(dtype)
    q = np.round(values / scale + zero_point)
    if np.issubdtype(dtype, np.integer):
        info = np.iinfo(dtype)
        q = np.clip(q, info.min, info.max)
    return q.astype(dtype)


def _load_keras_runner(model_path: str) -> ModelRunner:
    model = tf.keras.models.load_model(model_path)

    input_shape = model.input_shape
    if isinstance(input_shape, list):
        input_shape = input_shape[0]
    if not isinstance(input_shape, tuple) or len(input_shape) < 4:
        raise ValueError(f"Unsupported Keras input shape: {input_shape}")

    in_h = int(input_shape[1]) if input_shape[1] is not None else IMG_SIZE[0]
    in_w = int(input_shape[2]) if input_shape[2] is not None else IMG_SIZE[1]
    in_c = int(input_shape[3]) if input_shape[3] is not None else 1

    output_shape = model.output_shape
    if isinstance(output_shape, list):
        output_shape = output_shape[0]
    out_dim = int(output_shape[-1]) if isinstance(output_shape, tuple) else None

    def _predict(batch: np.ndarray) -> np.ndarray:
        spatial_batch = _resize_spatial(batch, in_h, in_w)
        input_batch = _adapt_channels(spatial_batch, in_c)
        preds = model.predict(input_batch, verbose=0)[0]
        preds = np.asarray(preds, dtype=np.float32).reshape(-1)
        if preds.size and (preds.min() < -1e-5 or preds.max() > 1.0 + 1e-5):
            preds = tf.nn.softmax(preds).numpy().astype(np.float32)
        return preds

    return ModelRunner(
        backend_name="keras",
        model_path=model_path,
        input_size=(in_h, in_w),
        input_channels=in_c,
        output_dim=out_dim,
        predict_fn=_predict,
    )


def _load_tflite_runner(model_path: str) -> ModelRunner:
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()[0]
    output_details = interpreter.get_output_details()[0]

    input_shape = input_details["shape"]
    if len(input_shape) != 4:
        raise ValueError(f"Unsupported TFLite input shape: {input_shape}")

    in_h = int(input_shape[1])
    in_w = int(input_shape[2])
    in_c = int(input_shape[3])

    output_shape = output_details.get("shape", [])
    out_dim = int(output_shape[-1]) if len(output_shape) >= 2 else None

    in_dtype = input_details["dtype"]
    in_scale, in_zero = input_details.get("quantization", (0.0, 0))
    out_dtype = output_details["dtype"]
    out_scale, out_zero = output_details.get("quantization", (0.0, 0))

    def _predict(batch: np.ndarray) -> np.ndarray:
        spatial_batch = _resize_spatial(batch, in_h, in_w)
        input_batch = _adapt_channels(spatial_batch, in_c)
        if in_dtype == np.float32:
            model_input = input_batch.astype(np.float32)
        else:
            model_input = _quantize_tensor(input_batch, in_scale, in_zero, in_dtype)

        interpreter.set_tensor(input_details["index"], model_input)
        interpreter.invoke()

        output = interpreter.get_tensor(output_details["index"])[0]
        output = np.asarray(output)

        if out_dtype != np.float32 and out_scale > 0:
            output = (output.astype(np.float32) - out_zero) * out_scale
        else:
            output = output.astype(np.float32)

        output = output.reshape(-1)
        if output.size and (output.min() < -1e-5 or output.max() > 1.0 + 1e-5):
            output = tf.nn.softmax(output).numpy().astype(np.float32)
        return output

    return ModelRunner(
        backend_name="tflite",
        model_path=model_path,
        input_size=(in_h, in_w),
        input_channels=in_c,
        output_dim=out_dim,
        predict_fn=_predict,
    )


def _load_savedmodel_runner(model_path: str) -> ModelRunner:
    loaded = tf.saved_model.load(model_path)
    signatures = getattr(loaded, "signatures", {})
    if not signatures:
        raise ValueError("SavedModel has no callable signatures")

    infer_fn = signatures.get("serving_default")
    if infer_fn is None:
        infer_fn = next(iter(signatures.values()))

    _, input_specs = infer_fn.structured_input_signature
    if not isinstance(input_specs, dict) or len(input_specs) != 1:
        raise ValueError(f"Expected exactly 1 SavedModel input, got {input_specs}")

    input_name, input_spec = next(iter(input_specs.items()))
    if len(input_spec.shape) != 4:
        raise ValueError(f"Unsupported SavedModel input shape: {input_spec.shape}")

    in_h = int(input_spec.shape[1]) if input_spec.shape[1] is not None else IMG_SIZE[0]
    in_w = int(input_spec.shape[2]) if input_spec.shape[2] is not None else IMG_SIZE[1]
    in_c = int(input_spec.shape[3]) if input_spec.shape[3] is not None else 1
    in_dtype = input_spec.dtype

    output_specs = infer_fn.structured_outputs
    if isinstance(output_specs, dict) and output_specs:
        first_key = next(iter(output_specs.keys()))
        output_spec = output_specs[first_key]
        out_dim = int(output_spec.shape[-1]) if len(output_spec.shape) >= 2 else None
    else:
        out_dim = None

    def _predict(batch: np.ndarray) -> np.ndarray:
        spatial_batch = _resize_spatial(batch, in_h, in_w)
        input_batch = _adapt_channels(spatial_batch, in_c)
        tensor_input = tf.convert_to_tensor(input_batch, dtype=in_dtype)
        raw_output = infer_fn(**{input_name: tensor_input})

        if isinstance(raw_output, dict):
            output_tensor = next(iter(raw_output.values()))
        else:
            output_tensor = raw_output

        preds = output_tensor.numpy()[0].astype(np.float32).reshape(-1)
        if preds.size and (preds.min() < -1e-5 or preds.max() > 1.0 + 1e-5):
            preds = tf.nn.softmax(preds).numpy().astype(np.float32)
        return preds

    return ModelRunner(
        backend_name="saved_model",
        model_path=model_path,
        input_size=(in_h, in_w),
        input_channels=in_c,
        output_dim=out_dim,
        predict_fn=_predict,
    )


def load_model_runner(class_names):
    """Pick and load the best available model backend for inference."""
    preferred_path = os.environ.get("AIR_WRITE_MODEL_PATH")
    ordered_candidates = []
    if preferred_path:
        ordered_candidates.append(preferred_path)
    ordered_candidates.extend([MODEL_KERAS_PATH, MODEL_H5_PATH, MODEL_TFLITE_PATH, MODEL_SAVEDMODEL_PATH])

    seen = set()
    candidates = []
    for path in ordered_candidates:
        norm = os.path.normpath(path)
        if norm in seen:
            continue
        seen.add(norm)
        if os.path.exists(path):
            candidates.append(path)

    if not candidates:
        raise FileNotFoundError(
            "No model file found. Checked: "
            f"{MODEL_KERAS_PATH}, {MODEL_H5_PATH}, {MODEL_TFLITE_PATH}, {MODEL_SAVEDMODEL_PATH}"
        )

    loaded = []
    for path in candidates:
        try:
            if path.lower().endswith(".tflite"):
                runner = _load_tflite_runner(path)
            elif os.path.isdir(path):
                runner = _load_savedmodel_runner(path)
            else:
                runner = _load_keras_runner(path)
            loaded.append(runner)
            print(
                f"[INFO] Loaded {runner.backend_name} model from {path} "
                f"(input={runner.input_size}x{runner.input_channels}, output={runner.output_dim})"
            )
        except Exception as exc:
            print(f"[WARN] Failed to load model '{path}': {exc}")

    if not loaded:
        raise RuntimeError("Could not load any available model backend")

    expected_classes = len(class_names)
    for runner in loaded:
        if isinstance(runner.output_dim, int) and runner.output_dim == expected_classes:
            return runner

    print(
        f"[WARN] No model output dimension matched class map size ({expected_classes}). "
        f"Using first loaded model: {loaded[0].model_path}"
    )
    return loaded[0]


# ─────────────────────────────────────────────
# GESTURE DETECTION HELPERS
# ─────────────────────────────────────────────

def _dist(a, b) -> float:
    return float(np.hypot(a.x - b.x, a.y - b.y))


def _finger_extended(lm, tip_id: int, pip_id: int) -> bool:
    """Finger is extended when its tip is clearly farther from wrist than its PIP joint."""
    wrist = lm[0]
    tip = lm[tip_id]
    pip = lm[pip_id]
    return _dist(tip, wrist) > (_dist(pip, wrist) * EXTEND_RATIO)


def _finger_folded(lm, tip_id: int, pip_id: int) -> bool:
    """Finger is folded when its tip sits closer to wrist than its PIP joint."""
    wrist = lm[0]
    tip = lm[tip_id]
    pip = lm[pip_id]
    return _dist(tip, wrist) < (_dist(pip, wrist) * FOLD_RATIO)


def _finger_states(hand_landmarks):
    """Returns robust extended/folded state for thumb + non-thumb fingers."""
    lm = hand_landmarks.landmark
    thumb = _finger_extended(lm, 4, 3)
    index = _finger_extended(lm, 8, 6)
    middle = _finger_extended(lm, 12, 10)
    ring = _finger_extended(lm, 16, 14)
    pinky = _finger_extended(lm, 20, 18)
    return thumb, index, middle, ring, pinky


def _landmark_positions(hand_landmarks, frame_w: int, frame_h: int):
    """Builds [id, x, y] landmark list using pixel coordinates."""
    lm_list = []
    for idx, lm in enumerate(hand_landmarks.landmark):
        cx, cy = int(lm.x * frame_w), int(lm.y * frame_h)
        lm_list.append([idx, cx, cy])
    return lm_list


def _fingers_up_from_landmarks(hand_landmarks, frame_w: int, frame_h: int):
    """User-requested finger-state logic: thumb by x-axis, others by y-axis."""
    lm_list = _landmark_positions(hand_landmarks, frame_w, frame_h)
    if len(lm_list) < 21:
        return [0, 0, 0, 0, 0]

    fingers = []

    # Thumb (x-axis comparison)
    fingers.append(1 if lm_list[4][1] < lm_list[3][1] else 0)

    # Index, middle, ring, pinky (y-axis comparison)
    for tip_id in [8, 12, 16, 20]:
        fingers.append(1 if lm_list[tip_id][2] < lm_list[tip_id - 2][2] else 0)

    return fingers


def classify_gesture_command(hand_landmarks, frame_w: int = None, frame_h: int = None) -> str:
    """Classifies hand into high-level command gesture for interaction."""
    if frame_w is not None and frame_h is not None:
        thumb, index, middle, ring, pinky = _fingers_up_from_landmarks(
            hand_landmarks, frame_w, frame_h
        )

        # Draw: index up, others down (thumb can be either; helps real writing posture).
        if index == 1 and middle == 0 and ring == 0 and pinky == 0:
            return "DRAW"
        # Clear: closed fist.
        if thumb == 0 and index == 0 and middle == 0 and ring == 0 and pinky == 0:
            return "CLEAR"
        # Legacy clear fallback.
        if thumb == 0 and index == 1 and middle == 0 and ring == 0 and pinky == 1:
            return "CLEAR"
        # Hover/reposition without drawing: open palm.
        if index == 1 and middle == 1 and ring == 1 and pinky == 1:
            return "HOVER"
        # Predict: thumb up only.
        if thumb == 1 and index == 0 and middle == 0 and ring == 0 and pinky == 0:
            return "PREDICT"
        return "IDLE"

    # Fallback to orientation-invariant logic if frame size is not provided.
    thumb, index, middle, ring, pinky = _finger_states(hand_landmarks)
    non_thumb_extended_count = int(index) + int(middle) + int(ring) + int(pinky)
    if (not thumb) and index and (not middle) and (not ring) and (not pinky):
        return "DRAW"
    if (not thumb) and (non_thumb_extended_count == 0):
        return "CLEAR"
    if (not thumb) and index and (not middle) and (not ring) and pinky:
        return "CLEAR"
    if index and middle and ring and pinky:
        return "HOVER"
    if thumb and (non_thumb_extended_count == 0):
        return "PREDICT"
    return "IDLE"

def is_writing_gesture(hand_landmarks) -> bool:
    """
    Returns True for a stable single-finger writing pose:
      - index finger up
      - middle/ring/pinky down
    This avoids accidental writing when hand is open.
    """
    return classify_gesture_command(hand_landmarks) == "DRAW"


def is_stop_gesture(hand_landmarks) -> bool:
    """
    Returns True when only thumb is extended.
    Used to stop capturing the current stroke and trigger recognition.
    """
    return classify_gesture_command(hand_landmarks) == "PREDICT"


def get_fingertip(hand_landmarks, frame_w, frame_h):
    """Returns (x, y) pixel coordinate of index fingertip."""
    tip = hand_landmarks.landmark[8]
    return int(tip.x * frame_w), int(tip.y * frame_h)


def _shift_image_no_wrap(img: np.ndarray, dy: int, dx: int) -> np.ndarray:
    """Shift 2D image by (dy, dx) with zero-fill (no circular wrap)."""
    shifted = np.zeros_like(img)

    src_y0 = max(0, -dy)
    src_y1 = img.shape[0] - max(0, dy)
    src_x0 = max(0, -dx)
    src_x1 = img.shape[1] - max(0, dx)

    if src_y0 >= src_y1 or src_x0 >= src_x1:
        return shifted

    dst_y0 = max(0, dy)
    dst_x0 = max(0, dx)
    dst_y1 = dst_y0 + (src_y1 - src_y0)
    dst_x1 = dst_x0 + (src_x1 - src_x0)

    shifted[dst_y0:dst_y1, dst_x0:dst_x1] = img[src_y0:src_y1, src_x0:src_x1]
    return shifted


def _predict_character_from_image(img_input, model_runner, class_names):
    """Decode a model output tensor into a character and top-k labels."""
    if img_input is None:
        return None, None, None, []

    if USE_TTA_PREDICTION:
        base = img_input[0, :, :, 0]
        tta_preds = []
        for dy, dx in TTA_PIXEL_SHIFTS:
            shifted = _shift_image_no_wrap(base, dy=dy, dx=dx)
            shifted_batch = shifted.reshape(1, img_input.shape[1], img_input.shape[2], 1).astype(np.float32)
            tta_preds.append(model_runner.predict(shifted_batch))
        preds = np.mean(np.stack(tta_preds, axis=0), axis=0).astype(np.float32)
    else:
        preds = model_runner.predict(img_input)

    if preds is None or len(preds) == 0:
        return None, None, None, []

    top_idx = int(np.argmax(preds))
    confidence = float(preds[top_idx])
    char = class_names[top_idx] if top_idx < len(class_names) else str(top_idx)

    topk_idx = np.argsort(preds)[-3:][::-1]
    top3 = []
    for idx in topk_idx:
        label = class_names[int(idx)] if int(idx) < len(class_names) else str(int(idx))
        top3.append((label, float(preds[int(idx)])))

    return char, confidence, top_idx, top3


def predict_character_from_canvas(canvas, model_runner, class_names):
    """Run model prediction on current stroke canvas and decode top-1 label."""
    img_input = stroke_to_image(canvas)
    if img_input is None:
        return None, None, None, []

    if DEBUG_SAVE_PREPROCESS:
        debug_image = (img_input[0, :, :, 0] * 255.0).clip(0, 255).astype(np.uint8)
        cv2.imwrite(DEBUG_PREPROCESS_PATH, debug_image)

    if not AUTO_SELECT_STROKE_ORIENTATION:
        return _predict_character_from_image(img_input, model_runner, class_names)

    original = _predict_character_from_image(img_input, model_runner, class_names)
    flipped_input = img_input[:, :, ::-1, :]
    flipped = _predict_character_from_image(flipped_input, model_runner, class_names)

    if original[0] is None:
        return flipped
    if flipped[0] is None:
        return original

    if flipped[1] > original[1]:
        print(f"[INFO] Auto-selected flipped stroke orientation for '{flipped[0]}'")
        return flipped

    return original


def canvas_ink_pixels(canvas: np.ndarray) -> int:
    """Counts stroke pixels above noise floor on the current canvas."""
    gray = np.max(canvas, axis=-1)
    return int(np.count_nonzero(gray > 25))


# ─────────────────────────────────────────────
# STROKE → IMAGE PREPROCESSING
# ─────────────────────────────────────────────

def stroke_to_image(canvas: np.ndarray) -> np.ndarray:
    """
    Convert a drawn stroke canvas into the same format as your training images:
      - Your training data: CYAN stroke on BLACK background (640×480 PNG)
      - We draw with cyan on the canvas, then:
          1. Collapse colour channels via max() → bright stroke on black
          2. Crop tight bounding box around stroke
          3. Pad to square, resize to IMG_SIZE (64×64)
          4. Normalise to [0, 1]
          5. Suppress noise below 10% brightness
    This exactly mirrors the preprocess_cyan_stroke() used during training.
    """
    # Flip only when live stroke orientation differs from what the model expects.
    working_canvas = cv2.flip(canvas, 1) if FLIP_STROKE_FOR_MODEL else canvas

    # Max across BGR channels — handles cyan, white, green, any bright colour
    gray = np.max(working_canvas, axis=-1)                   # shape (H, W)

    coords = cv2.findNonZero(gray)
    if coords is None:
        return None

    x, y, w, h = cv2.boundingRect(coords)
    padding = 12
    x = max(0, x - padding)
    y = max(0, y - padding)
    w = min(working_canvas.shape[1] - x, w + 2 * padding)
    h = min(working_canvas.shape[0] - y, h + 2 * padding)

    cropped = gray[y:y + h, x:x + w]

    # Pad to square (black background = 0)
    size = max(w, h)
    squared = np.zeros((size, size), dtype=np.uint8)
    y_off = (size - h) // 2
    x_off = (size - w) // 2
    squared[y_off:y_off + h, x_off:x_off + w] = cropped

    resized    = cv2.resize(squared, IMG_SIZE, interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0
    # Suppress JPEG/PNG compression noise (same threshold as training)
    normalized = np.where(normalized > 0.10, normalized, 0.0)
    return normalized.reshape(1, *IMG_SIZE, 1)


# ─────────────────────────────────────────────
# MAIN REAL-TIME LOOP
# ─────────────────────────────────────────────

def run_inference():
    global IMG_SIZE

    class_names = load_class_names(CLASS_MAP_PATH)

    # Load trained model backend (Keras/TFLite) and align preprocessing shape.
    model_runner = load_model_runner(class_names)
    IMG_SIZE = model_runner.input_size
    print(f"[INFO] Using model backend: {model_runner.backend_name}")
    print(f"[INFO] Using model path: {model_runner.model_path}")
    print(f"[INFO] Using model input size: {IMG_SIZE}")

    if isinstance(model_runner.output_dim, int) and model_runner.output_dim != len(class_names):
        print(
            f"[WARN] Model outputs {model_runner.output_dim} classes "
            f"but mapping has {len(class_names)} labels"
        )

    # MediaPipe setup
    mp_hands = mp.solutions.hands
    mp_draw  = mp.solutions.drawing_utils
    hands    = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.75,
        min_tracking_confidence=0.65,
    )

    cap = None
    selected_cam = None
    for cam_idx in (0, 1, 2):
        for backend in (cv2.CAP_DSHOW, None):
            if backend is None:
                trial = cv2.VideoCapture(cam_idx)
            else:
                trial = cv2.VideoCapture(cam_idx, backend)

            if trial.isOpened():
                cap = trial
                selected_cam = cam_idx
                break
            trial.release()
        if cap is not None:
            break

    if cap is None:
        print("[ERROR] Cannot open webcam (tried camera indices 0, 1, 2)")
        hands.close()
        return
    print(f"[INFO] Using webcam index: {selected_cam}")

    # Warm up camera stream and wait for a valid first frame.
    frame = None
    for _ in range(30):
        ret, candidate = cap.read()
        if ret and candidate is not None:
            frame = candidate
            break

    if frame is None:
        print("[ERROR] Webcam opened but no frames received. Close other camera apps and retry.")
        cap.release()
        hands.close()
        return

    h, w = frame.shape[:2]

    if USE_SQUARE_DRAW_REGION:
        draw_size = min(h, w)
        draw_x0 = (w - draw_size) // 2
        draw_y0 = (h - draw_size) // 2
        draw_x1 = draw_x0 + draw_size
        draw_y1 = draw_y0 + draw_size
    else:
        draw_x0, draw_y0 = 0, 0
        draw_x1, draw_y1 = w, h

    canvas        = np.zeros((h, w, 3), dtype=np.uint8)  # Drawing canvas
    prev_pt       = None
    writing       = False
    recognized    = ""
    all_text      = []
    history_pts   = deque(maxlen=SMOOTHING)               # Jitter smoothing
    confidence    = 0.0
    top3_text     = ""
    stroke_path_px = 0.0

    # Gesture hysteresis counters for stable command transitions
    command_counters = {
        "DRAW": 0,
        "CLEAR": 0,
        "HOVER": 0,
        "PREDICT": 0,
    }
    predict_latched = False
    clear_latched = False
    stroke_committed = False

    print("\n[CONTROLS]")
    print("  Gesture DRAW         -> index finger only")
    print("  Gesture CLEAR        -> close fist (index+pinky also supported)")
    print("  Gesture HOVER        -> open palm")
    print("  Gesture PREDICT      -> thumb up only")
    print("  Press 'P'            -> predict current canvas")
    print("  Press 'S'            -> save current text")
    print("  Press 'D'            -> save preprocessed model input")
    print("  Press 'Q'            -> quit\n")
    mirror_status = "ON (selfie mode)" if CAMERA_MIRROR else "OFF (non-mirrored)"
    print(f"[INFO] Camera mirror is {mirror_status}")
    print(f"[INFO] Preprocess horizontal flip for model: {FLIP_STROKE_FOR_MODEL}")
    if USE_SQUARE_DRAW_REGION:
        print("[INFO] Square draw region enabled")

    missed_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret or frame is None:
            missed_frames += 1
            if missed_frames >= 15:
                print("[WARN] Lost webcam stream. Ending session.")
                break
            continue
        missed_frames = 0

        if CAMERA_MIRROR:
            frame = cv2.flip(frame, 1)

        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        result = hands.process(rgb)

        gesture_label = "NO_HAND"

        if result.multi_hand_landmarks:
            for hl in result.multi_hand_landmarks:
                mp_draw.draw_landmarks(frame, hl, mp_hands.HAND_CONNECTIONS,
                                       mp_draw.DrawingSpec(color=(255, 200, 0),
                                                          thickness=2, circle_radius=3),
                                       mp_draw.DrawingSpec(color=(0, 200, 255),
                                                          thickness=2))

                gesture_now = classify_gesture_command(hl, w, h)
                tip_x, tip_y = get_fingertip(hl, w, h)

                # Smooth the fingertip position
                history_pts.append((tip_x, tip_y))
                smooth_x = int(np.mean([p[0] for p in history_pts]))
                smooth_y = int(np.mean([p[1] for p in history_pts]))
                in_draw_region = (
                    draw_x0 <= smooth_x < draw_x1 and
                    draw_y0 <= smooth_y < draw_y1
                )

                # Debounce command changes to avoid rapid toggling from jitter.
                for command_name in command_counters:
                    if command_name == gesture_now:
                        command_counters[command_name] += 1
                    else:
                        command_counters[command_name] = 0

                draw_active = command_counters["DRAW"] >= START_STABLE_FRAMES
                clear_active = command_counters["CLEAR"] >= CLEAR_STABLE_FRAMES
                hover_active = command_counters["HOVER"] >= HOVER_STABLE_FRAMES
                predict_active = command_counters["PREDICT"] >= STOP_STABLE_FRAMES

                if clear_active and (not clear_latched):
                    writing = False
                    prev_pt = None
                    clear_latched = True
                    stroke_committed = False
                    gesture_label = "CLEAR"
                    canvas = np.zeros((h, w, 3), dtype=np.uint8)
                    recognized = ""
                    confidence = 0.0
                    top3_text = ""
                    stroke_path_px = 0.0
                    print("[INFO] Gesture CLEAR -> canvas cleared")
                elif not clear_active:
                    clear_latched = False

                if predict_active and (not predict_latched):
                    writing = False
                    prev_pt = None
                    predict_latched = True
                    gesture_label = "PREDICT"

                    predict_canvas = canvas[draw_y0:draw_y1, draw_x0:draw_x1]
                    ink_pixels = canvas_ink_pixels(predict_canvas)
                    if ink_pixels < MIN_INK_PIXELS or stroke_path_px < MIN_STROKE_PATH_PX:
                        print(
                            "[WARN] Stroke too small for reliable prediction "
                            f"(ink={ink_pixels}, path={stroke_path_px:.1f}px)"
                        )
                    else:
                        char, confidence_val, _, top3 = predict_character_from_canvas(
                            predict_canvas, model_runner, class_names
                        )
                        if char is not None:
                            confidence = confidence_val
                            recognized = char
                            top3_text = " ".join([f"{lbl}:{prob*100:.0f}%" for lbl, prob in top3])

                            if confidence >= MIN_ACCEPT_CONFIDENCE and not stroke_committed:
                                all_text.append(char)
                                stroke_committed = True
                                canvas = np.zeros((h, w, 3), dtype=np.uint8)
                                stroke_path_px = 0.0
                                print(f"[INFO] Predicted '{char}' ({confidence*100:.1f}%)")
                            else:
                                print(
                                    f"[WARN] Low confidence ({confidence*100:.1f}%). "
                                    f"Top3: {top3_text}"
                                )
                elif (not predict_active):
                    predict_latched = False

                if draw_active:
                    # ── Writing mode: draw stroke ──
                    writing = True
                    gesture_label = "DRAW"
                    if prev_pt is not None and in_draw_region:
                        dx = smooth_x - prev_pt[0]
                        dy = smooth_y - prev_pt[1]
                        dist = float(np.hypot(dx, dy))

                        # Filter micro-jitter and large tracking jumps.
                        if dist >= MIN_MOVE_PX:
                            if dist <= MAX_JUMP_PX:
                                cv2.line(canvas, prev_pt, (smooth_x, smooth_y),
                                         STROKE_COLOR, STROKE_THICK)
                                stroke_path_px += dist
                                stroke_committed = False
                            else:
                                # Re-anchor without drawing a long incorrect line.
                                prev_pt = (smooth_x, smooth_y)
                    prev_pt = (smooth_x, smooth_y) if in_draw_region else None
                    # Fingertip indicator
                    tip_color = (0, 255, 255) if in_draw_region else (0, 0, 255)
                    cv2.circle(frame, (smooth_x, smooth_y), 8, tip_color, -1)
                elif hover_active:
                    writing = False
                    gesture_label = "HOVER"
                    # Reposition pen cursor without adding ink.
                    prev_pt = (smooth_x, smooth_y) if in_draw_region else None
                    tip_color = (255, 180, 0) if in_draw_region else (0, 0, 255)
                    cv2.circle(frame, (smooth_x, smooth_y), 8, tip_color, -1)
                else:
                    writing = False
                    prev_pt = None
                    if gesture_label == "NO_HAND":
                        gesture_label = gesture_now
                break
        else:
            # No hand detected: reset transient gesture state.
            writing = False
            prev_pt = None
            history_pts.clear()
            for command_name in command_counters:
                command_counters[command_name] = 0
            predict_latched = False
            clear_latched = False

        # Draw square writing ROI so gesture strokes do not stretch across wide frame.
        cv2.rectangle(frame, (draw_x0, draw_y0), (draw_x1, draw_y1), (90, 90, 90), 2)

        # ── Overlay canvas onto frame ──────────────────────
        combined = cv2.addWeighted(frame, 1.0, canvas, CANVAS_ALPHA, 0)

        # ── UI Panel ───────────────────────────────────────
        panel_h = 142
        panel   = np.zeros((panel_h, w, 3), dtype=np.uint8)
        panel[:] = (20, 20, 35)

        # Current text buffer
        text_display = "Text: " + " ".join(all_text)
        cv2.putText(panel, text_display, (15, 30),
                    cv2.FONT_HERSHEY_DUPLEX, 0.7, (200, 255, 200), 1)

        # Last recognised character + confidence
        if recognized:
            cv2.putText(panel, f"Predicted: {recognized}  ({confidence*100:.1f}%)",
                        (15, 65), cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 230, 255), 2)
        if top3_text:
            cv2.putText(panel, f"Top3: {top3_text}",
                        (15, 92), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (170, 210, 255), 1)

        # Gesture status
        color_map = {
            "DRAW": (0, 255, 100),
            "CLEAR": (90, 220, 255),
            "HOVER": (255, 210, 0),
            "PREDICT": (255, 165, 0),
            "IDLE": (150, 150, 150),
            "NO_HAND": (130, 130, 130),
        }
        g_color = color_map.get(gesture_label, (200, 200, 200))
        cv2.putText(panel, f"Gesture: {gesture_label}", (15, 118),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, g_color, 1)

        # Hint
        cv2.putText(panel, "Draw=index  Clear=fist  Hover=open palm  Predict=thumb",
                    (15, 137), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 140, 140), 1)
        cv2.putText(panel, "P=Predict  S=Save  Q=Quit", (w - 240, 118),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 120, 120), 1)

        output = np.vstack([combined, panel])
        cv2.imshow("Air-Writing Recognition System", output)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        elif key == ord("p"):
            predict_canvas = canvas[draw_y0:draw_y1, draw_x0:draw_x1]
            ink_pixels = canvas_ink_pixels(predict_canvas)
            if ink_pixels < MIN_INK_PIXELS or stroke_path_px < MIN_STROKE_PATH_PX:
                print(
                    "[WARN] Stroke too small for reliable prediction "
                    f"(ink={ink_pixels}, path={stroke_path_px:.1f}px)"
                )
            else:
                char, confidence_val, _, top3 = predict_character_from_canvas(
                    predict_canvas, model_runner, class_names
                )
                if char is not None:
                    confidence = confidence_val
                    recognized = char
                    top3_text = " ".join([f"{lbl}:{prob*100:.0f}%" for lbl, prob in top3])
                    if confidence >= MIN_ACCEPT_CONFIDENCE and not stroke_committed:
                        all_text.append(char)
                        stroke_committed = True
                        canvas = np.zeros((h, w, 3), dtype=np.uint8)
                        stroke_path_px = 0.0
                        print(f"[INFO] Predicted '{char}' ({confidence*100:.1f}%)")
                    else:
                        print(
                            f"[WARN] Low confidence ({confidence*100:.1f}%). "
                            f"Top3: {top3_text}"
                        )
                else:
                    print("[WARN] Canvas is empty or prediction failed")
        elif key == ord("d"):
            predict_canvas = canvas[draw_y0:draw_y1, draw_x0:draw_x1]
            img_input = stroke_to_image(predict_canvas)
            if img_input is None:
                print("[WARN] Canvas is empty; nothing to save")
            else:
                debug_image = (img_input[0, :, :, 0] * 255.0).clip(0, 255).astype(np.uint8)
                cv2.imwrite(DEBUG_PREPROCESS_PATH, debug_image)
                print(f"[INFO] Saved preprocessed input -> {DEBUG_PREPROCESS_PATH}")
        elif key == ord("s"):
            text = " ".join(all_text)
            fname = f"note_{len(all_text)}.txt"
            with open(fname, "w") as f:
                f.write(text)
            print(f"[INFO] Note saved → {fname}: '{text}'")

    cap.release()
    cv2.destroyAllWindows()
    hands.close()
    print("[INFO] Session ended")


if __name__ == "__main__":
    run_inference()
