"""
Air-Writing ML Microservice — Flask
Loads air_write_cnn.h5 once, exposes POST /predict
Called internally by Node.js backend only.
"""
import base64, io, os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import tensorflow as tf

MODEL_PATH  = os.environ.get("MODEL_PATH", "air_write_cnn.h5")
IMG_SIZE    = (48, 48)
CONF_FLOOR  = 0.40
PORT        = int(os.environ.get("ML_SERVICE_PORT", 6000))

CLASS_NAMES = [chr(c) for c in range(65, 91)] + [str(d) for d in range(10)]

app = Flask(__name__)
CORS(app)

print(f"[ML] Loading model from {MODEL_PATH} ...")
model = tf.keras.models.load_model(MODEL_PATH)
print("[ML] Model ready.")


def decode_image(data_url: str) -> np.ndarray:
    if "," in data_url:
        data_url = data_url.split(",", 1)[1]
    img_bytes = base64.b64decode(data_url)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(img)


def preprocess(img_array: np.ndarray):
    # max(R,G,B) collapses cyan stroke to bright grayscale — matches training
    gray = np.max(img_array, axis=-1).astype(np.uint8)
    ys, xs = np.nonzero(gray)
    if len(xs) == 0:
        return None
    pad = 12
    x0, x1 = max(0, xs.min()-pad), min(gray.shape[1], xs.max()+pad)
    y0, y1 = max(0, ys.min()-pad), min(gray.shape[0], ys.max()+pad)
    crop = gray[y0:y1, x0:x1]
    h, w = crop.shape
    size = max(h, w)
    sq = np.zeros((size, size), dtype=np.uint8)
    sq[(size-h)//2:(size-h)//2+h, (size-w)//2:(size-w)//2+w] = crop
    img = Image.fromarray(sq).resize(IMG_SIZE, Image.BILINEAR)
    arr = np.array(img).astype(np.float32) / 255.0
    arr = np.where(arr > 0.10, arr, 0.0)
    return arr.reshape(1, *IMG_SIZE, 1)


@app.route("/health")
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    body = request.get_json(silent=True)
    if not body or "image" not in body:
        return jsonify({"error": "Missing image field"}), 400
    try:
        img_array = decode_image(body["image"])
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    processed = preprocess(img_array)
    if processed is None:
        return jsonify({"char": None, "confidence": 0.0, "error": "blank_canvas"})

    preds      = model.predict(processed, verbose=0)[0]
    top_idx    = int(np.argmax(preds))
    confidence = float(preds[top_idx])
    char       = CLASS_NAMES[top_idx] if top_idx < len(CLASS_NAMES) else "?"

    return jsonify({
        "char":           char,
        "confidence":     confidence,
        "low_confidence": confidence < CONF_FLOOR,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=False)