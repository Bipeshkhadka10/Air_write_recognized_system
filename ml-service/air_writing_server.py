"""
Air-Writing Recognition — Flask Integration Server
===================================================
Drop this file next to air_write_cnn.keras and class_indices.json.
Run: python air_writing_server.py

Receives a base64 canvas image from liveWriting.jsx (React frontend),
applies the EXACT same preprocessing as air_writing_cnn_train.py,
and returns the predicted character + confidence.

API:
  POST /predict    { "image": "<dataURL or raw base64>" }
  GET  /health
"""

import os, json, base64
import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    import tensorflow as tf
except ImportError:
    raise ImportError("Run: pip install tensorflow flask flask-cors")

# ── Config — must match training exactly ──────────────────────────────────────
IMG_SIZE        = (64, 64)
MODEL_PATH      = "air_write_cnn.keras"
CLASS_MAP_PATH  = "class_indices.json"
MIN_INK_PIXELS  = 80           # Minimum stroke pixels to attempt prediction
NOISE_THRESHOLD = 0.10         # Below this brightness → treat as background (matches training)
MIN_CONFIDENCE  = 0.0          # Set to e.g. 0.50 to reject low-confidence guesses

app = Flask(__name__)
CORS(app)

# ── Load model once at startup ────────────────────────────────────────────────
print(f"[INFO] Loading model: {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)
print(f"[INFO] Input shape : {model.input_shape}")   # should be (None, 64, 64, 1)
print(f"[INFO] Output shape: {model.output_shape}")  # should be (None, 36)

with open(CLASS_MAP_PATH) as f:
    CLASS_NAMES = json.load(f)["index_to_class"]
print(f"[INFO] Classes ({len(CLASS_NAMES)}): {CLASS_NAMES}")


# ── Core preprocessing — mirrors preprocess_cyan_stroke() in training ─────────
def preprocess_canvas(canvas_bgr: np.ndarray):
    """
    Convert a BGR image of the drawn stroke canvas into the model's input tensor.

    Must exactly match the training pipeline in air_writing_cnn_train.py:
      1. max(R, G, B)  → single-channel brightness map
         WHY: Training used np.max(image_batch, axis=-1), NOT grayscale formula.
              Cyan stroke (B=255, G=255, R=0): standard grayscale → 0.299*0+0.587*255+0.114*255 ≈ 179
              max() → 255. Different value = model sees something it never saw during training
              → confidently predicts the WRONG class every time (same wrong class = always one letter).
      2. Bounding box + 12px padding  → crop tight around the stroke
      3. Pad shorter axis to square   → preserve aspect ratio
      4. Resize to 64×64
      5. Normalize to [0, 1]
      6. Zero-out pixels < NOISE_THRESHOLD (matches training's noise suppression)
      7. Reshape to (1, 64, 64, 1) batch

    Returns (tensor, ink_pixel_count). tensor is None if canvas is empty.
    """
    # 1. Max across colour channels → shape (H, W) uint8
    gray = np.max(canvas_bgr, axis=-1)

    # Count actual ink pixels (above noise floor)
    ink_pixels = int(np.count_nonzero(gray > 25))
    if ink_pixels < MIN_INK_PIXELS:
        return None, ink_pixels

    # 2. Tight bounding box + padding
    coords = cv2.findNonZero(gray)
    if coords is None:
        return None, 0

    x, y, w, h = cv2.boundingRect(coords)
    pad = 12
    x = max(0, x - pad)
    y = max(0, y - pad)
    w = min(canvas_bgr.shape[1] - x, w + 2 * pad)
    h = min(canvas_bgr.shape[0] - y, h + 2 * pad)
    cropped = gray[y:y + h, x:x + w]

    # 3. Pad to square
    size = max(w, h)
    squared = np.zeros((size, size), dtype=np.uint8)
    y_off = (size - h) // 2
    x_off = (size - w) // 2
    squared[y_off:y_off + h, x_off:x_off + w] = cropped

    # 4. Resize
    resized = cv2.resize(squared, IMG_SIZE, interpolation=cv2.INTER_AREA)

    # 5–6. Normalize + noise suppression
    normalized = resized.astype(np.float32) / 255.0
    normalized = np.where(normalized > NOISE_THRESHOLD, normalized, 0.0)

    # 7. Batch tensor
    tensor = normalized.reshape(1, IMG_SIZE[0], IMG_SIZE[1], 1)
    return tensor, ink_pixels


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "classes": len(CLASS_NAMES), "model": MODEL_PATH})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    if not data or "image" not in data:
        return jsonify({"error": "Missing 'image' field"}), 400

    raw = data["image"]

    # ── BUG FIX 1: Strip the data URL prefix if present ──────────────────────
    # liveWriting.jsx sends canvas.toDataURL('image/png') which includes
    # "data:image/png;base64," at the start — base64.b64decode() chokes on it.
    if "," in raw:
        raw = raw.split(",", 1)[1]

    # ── Decode base64 → OpenCV BGR image ─────────────────────────────────────
    try:
        img_bytes  = base64.b64decode(raw)
        img_array  = np.frombuffer(img_bytes, dtype=np.uint8)
        # IMREAD_COLOR: reads as BGR (3 channels), drops alpha if RGBA PNG
        canvas_bgr = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        if canvas_bgr is None:
            raise ValueError("imdecode returned None — invalid image data")
    except Exception as e:
        return jsonify({"error": f"Image decode failed: {e}"}), 400

    # ── BUG FIX 2: Ensure black background ───────────────────────────────────
    # Browser canvas default is transparent (alpha=0, RGB=0,0,0).
    # When React draws cyan strokes on transparent canvas and sends as PNG,
    # OpenCV reads transparent pixels as (0,0,0) — which is fine, black background.
    # BUT if the canvas element has a white CSS background, transparent areas
    # composite to white → max(255,255,255) = 255 everywhere → model sees solid white.
    # Solution: the React canvas must NOT have a white CSS background.
    # We detect this case and invert: if >80% of pixels are bright, assume white bg.
    gray_check = np.max(canvas_bgr, axis=-1)
    bright_ratio = np.count_nonzero(gray_check > 200) / gray_check.size
    if bright_ratio > 0.80:
        # White background detected — invert so stroke is bright on black
        canvas_bgr = 255 - canvas_bgr

    # ── Preprocess ────────────────────────────────────────────────────────────
    tensor, ink_pixels = preprocess_canvas(canvas_bgr)

    if tensor is None:
        return jsonify({
            "error":        "Stroke too small — keep drawing",
            "ink_pixels":   ink_pixels,
            "min_required": MIN_INK_PIXELS,
        }), 422

    # ── Predict ───────────────────────────────────────────────────────────────
    preds      = model.predict(tensor, verbose=0)[0]          # shape (36,)
    top_idx    = int(np.argmax(preds))
    confidence = float(preds[top_idx])
    char       = CLASS_NAMES[top_idx]

    top3_idx = np.argsort(preds)[-3:][::-1]
    top3 = [[CLASS_NAMES[int(i)], round(float(preds[int(i)]), 4)] for i in top3_idx]

    print(f"[PREDICT] '{char}' ({confidence:.1%}) top3={top3} ink={ink_pixels}px")

    return jsonify({
        "data": {
            "char":           char,
            "confidence":     round(confidence, 4),
            "top3":           top3,
            "low_confidence": confidence < 0.55,
            "ink_pixels":     ink_pixels,
        }
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
