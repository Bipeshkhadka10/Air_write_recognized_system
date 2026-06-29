"""
Air-Writing Recognition System — CNN Training Pipeline
Far-Western University, School of Engineering
Authors: Babita Kumari Bhatt, Bipesh Khadka, Saraswati Bhandari, Yogesh Awasthi

This script trains a lightweight CNN (with optional CNN+LSTM branch) to recognize
air-written characters (A–Z uppercase + 0–9 digits = 36 classes).

Dataset expected layout (EMNIST-style or your custom dataset):
    dataset/
        train/
            A/ img1.png img2.png ...
            B/ ...
            ...
            9/ ...
        val/
            A/ ...
            ...

Or point DATA_DIR at a single folder and the script will auto-split.

Requirements:
    pip install tensorflow opencv-python scikit-learn matplotlib numpy

Run:
    python air_writing_cnn_train.py
"""

import os
import json
import re
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau, TensorBoard
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import datetime

# ─────────────────────────────────────────────
# CONFIGURATION — Edit these paths/settings
# ─────────────────────────────────────────────
DATA_DIR        = "final_dataset"          # Root folder of your dataset
DATA_SOURCE     = "folder"           # "folder", "tfds", or "hybrid" (TFDS + local)
TFDS_DATASET    = "emnist/byclass"   # Used when DATA_SOURCE == "tfds"
IMG_SIZE        = (64, 64)           # Smaller images train faster on CPU
BATCH_SIZE      = 16                 # Larger batches reduce step count
EPOCHS          = 30                 # Give the model enough time to learn all 36 classes
NUM_CLASSES     = 36                 # Will be auto-detected from dataset
LEARNING_RATE   = 5e-4
DROPOUT_RATE    = 0.3
USE_LSTM_BRANCH = False              # Set True to enable CNN+LSTM sequential model
MODEL_SAVE_PATH = "air_write_cnn.keras"
CLASS_MAP_PATH  = "class_indices.json"
LOG_DIR         = "logs/fit/" + datetime.datetime.now().strftime("%Y%m%d-%H%M%S")

# Fast mode: cap TFDS sample counts for quicker demo training.
FAST_MODE = False
FAST_TRAIN_SAMPLES = 60000
FAST_VAL_SAMPLES = 12000
LOCAL_VAL_SPLIT = 0.2
LOCAL_OVERSAMPLE_FACTOR = 3
USE_FULL_DATASET_SPLIT = True

# Fallback class labels (digits first, then A-Z)
CLASS_NAMES = [str(d) for d in range(10)] + [chr(c) for c in range(65, 91)]
CLASS_TO_INDEX = {name: idx for idx, name in enumerate(CLASS_NAMES)}


# ─────────────────────────────────────────────
# 1. DATA LOADING & AUGMENTATION
# ─────────────────────────────────────────────
def preprocess_cyan_stroke(image_batch: np.ndarray) -> np.ndarray:
    """
    Your dataset images are CYAN strokes on a BLACK background (BGR/RGB).
    This function converts them to a clean grayscale representation so the
    CNN sees bright stroke on dark background — same as standard EMNIST format.

    Steps:
      1. Take max across R, G, B channels  →  any bright colour becomes bright
      2. Normalize to [0, 1]
      3. Threshold faint noise away (pixels below 10% brightness → 0)

    This works for cyan (high G + B), white, green, blue stroke colours.
    """
    # image_batch shape: (N, H, W, 3) — values already rescaled to [0,1] by ImageDataGenerator
    # Max-pool across colour channels → (N, H, W, 1)
    gray = np.max(image_batch, axis=-1, keepdims=True)
    # Suppress near-zero noise from compression artifacts
    gray = np.where(gray > 0.10, gray, 0.0)
    return gray


def compute_class_weights(data_dir: str):
    """Compute inverse-frequency class weights from the folder dataset."""
    class_counts = {}

    for class_name in sorted(os.listdir(data_dir)):
        class_path = os.path.join(data_dir, class_name)
        if not os.path.isdir(class_path):
            continue

        count = sum(1 for name in os.listdir(class_path) if os.path.isfile(os.path.join(class_path, name)))
        if count > 0:
            class_counts[class_name] = count

    if not class_counts:
        return None

    total = sum(class_counts.values())
    num_classes = len(class_counts)
    class_to_index = {name: idx for idx, name in enumerate(sorted(class_counts))}

    class_weight = {
        class_to_index[name]: total / (num_classes * count)
        for name, count in class_counts.items()
    }

    print(f"[INFO] Class weights enabled for {len(class_weight)} classes")
    return class_weight


def build_data_generators(data_dir: str):
    """
    Build train/val datasets using tf.keras.preprocessing.image_dataset_from_directory.
    Returns: (train_dataset, val_dataset, num_classes) with proper one-hot encoded labels
    Uses sequential loading (no shuffle, num_parallel_calls=1) for maximum stability.
    """
    # Create train/val split using the modern API - disable shuffle for stability
    print("[INFO] Loading training dataset...")
    train_dataset = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        seed=42,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        color_mode="grayscale",
        subset="training",
        validation_split=0.2,
        shuffle=False,  # Disable shuffle to avoid concurrency issues
    )
    
    print("[INFO] Loading validation dataset...")
    val_dataset = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        seed=42,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        color_mode="grayscale",
        subset="validation",
        validation_split=0.2,
        shuffle=False,  # Disable shuffle for stability
    )
    
    # Get number of classes BEFORE applying transformations
    num_classes = len(train_dataset.class_names)
    
    # Normalize images and convert labels to one-hot
    def normalize_and_encode(x, y):
        x = tf.cast(x, tf.float32) / 255.0  # Normalize to [0,1]
        y = tf.one_hot(y, num_classes)  # Convert to one-hot encoding
        return x, y
    
    # Serial processing (num_parallel_calls=1) for maximum stability
    train_dataset = train_dataset.map(normalize_and_encode, num_parallel_calls=1)
    val_dataset = val_dataset.map(normalize_and_encode, num_parallel_calls=1)
    
    # Minimal prefetch to avoid memory issues and race conditions
    train_dataset = train_dataset.prefetch(1)
    val_dataset = val_dataset.prefetch(1)
    
    return train_dataset, val_dataset, num_classes


def save_class_mapping(class_indices: dict, path: str = CLASS_MAP_PATH):
    """Persist class index mapping so inference can decode predictions correctly."""
    index_to_class = [name for name, idx in sorted(class_indices.items(), key=lambda kv: kv[1])]
    payload = {
        "index_to_class": index_to_class,
        "class_to_index": class_indices,
        "num_classes": len(index_to_class),
    }
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"[INFO] Class mapping saved -> {path}")


def _extract_local_label(parent_dir: str, filename: str):
    """Infer class label from folder name or filename for custom local data."""
    if parent_dir in CLASS_TO_INDEX:
        return parent_dir

    # Common user convention: dataset/Numbers/Number_5.png
    if parent_dir.lower() == "numbers":
        stem = os.path.splitext(filename)[0]
        token = stem.split("_")[0].upper()
        if token in CLASS_TO_INDEX:
            return token

        # Accept only an unambiguous single trailing digit (e.g. Number_7).
        # Multi-digit suffixes like Number_10 are skipped because they are ambiguous.
        m = re.search(r"([0-9]+)$", stem)
        if m and len(m.group(1)) == 1:
            return m.group(1)

    return None


def index_local_samples(data_dir: str):
    """Collect local image paths and labels from custom dataset folder."""
    image_exts = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
    file_paths = []
    labels = []
    skipped = 0

    for root, _, files in os.walk(data_dir):
        parent = os.path.basename(root)
        for name in files:
            ext = os.path.splitext(name)[1].lower()
            if ext not in image_exts:
                continue

            label_name = _extract_local_label(parent, name)
            if label_name is None:
                skipped += 1
                continue

            file_paths.append(os.path.join(root, name))
            labels.append(CLASS_TO_INDEX[label_name])

    print(f"[INFO] Local samples indexed: {len(file_paths)} (skipped: {skipped})")
    return file_paths, labels


def _split_local_paths(paths, labels, val_split=LOCAL_VAL_SPLIT, seed=42):
    """Stratified split for local custom samples."""
    if not paths:
        return [], [], [], []

    grouped = {i: [] for i in range(NUM_CLASSES)}
    for p, y in zip(paths, labels):
        grouped[y].append(p)

    rng = np.random.default_rng(seed)
    train_paths, train_labels = [], []
    val_paths, val_labels = [], []

    for cls, cls_paths in grouped.items():
        if not cls_paths:
            continue
        cls_paths = np.array(cls_paths)
        idx = np.arange(len(cls_paths))
        rng.shuffle(idx)

        val_count = max(1, int(round(len(cls_paths) * val_split))) if len(cls_paths) > 2 else 1
        val_count = min(val_count, len(cls_paths) - 1) if len(cls_paths) > 1 else 0

        val_idx = idx[:val_count]
        tr_idx = idx[val_count:]

        for i in tr_idx:
            train_paths.append(cls_paths[i])
            train_labels.append(cls)
        for i in val_idx:
            val_paths.append(cls_paths[i])
            val_labels.append(cls)

    return train_paths, train_labels, val_paths, val_labels


def _parse_local_image(path, label):
    """Decode local RGB image and convert stroke to single-channel grayscale-like map."""
    img = tf.io.read_file(path)
    img = tf.io.decode_image(img, channels=3, expand_animations=False)
    img.set_shape([None, None, 3])
    img = tf.image.resize(img, IMG_SIZE)
    img = tf.cast(img, tf.float32) / 255.0

    # Match existing cyan-stroke preprocessing: keep brightest channel.
    img = tf.reduce_max(img, axis=-1, keepdims=True)
    img = tf.where(img > 0.10, img, 0.0)

    y = tf.one_hot(label, NUM_CLASSES)
    return img, y


def _build_local_tf_dataset(paths, labels, training: bool):
    if not paths:
        return None

    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    if training:
        ds = ds.shuffle(min(len(paths), 8192), reshuffle_each_iteration=True)
    ds = ds.map(_parse_local_image, num_parallel_calls=tf.data.AUTOTUNE)
    return ds


def _train_with_tf_dataset(model: keras.Model, ds_train, ds_val):
    """Compile and fit on tf.data datasets (used by TFDS and hybrid paths)."""
    early_patience = 5 if FAST_MODE else 12
    histogram_freq = 0 if FAST_MODE else 1

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
        metrics=["accuracy", keras.metrics.TopKCategoricalAccuracy(k=3, name="top3_acc")],
    )

    model.summary()

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=early_patience,
            restore_best_weights=True,
            verbose=1,
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=max(2, early_patience // 2),
            min_lr=1e-6,
            verbose=1,
        ),
        ModelCheckpoint(
            filepath=MODEL_SAVE_PATH,
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        TensorBoard(log_dir=LOG_DIR, histogram_freq=histogram_freq),
    ]

    history = model.fit(
        ds_train,
        validation_data=ds_val,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1,
    )
    return history


# ─────────────────────────────────────────────
# 2. MODEL ARCHITECTURES
# ─────────────────────────────────────────────

def build_cnn_model(num_classes: int) -> keras.Model:
    """
    Lightweight custom CNN optimised for grayscale stroke images.
    Architecture:
        Conv Block 1 → Conv Block 2 → Conv Block 3 → Conv Block 4
        → GlobalAvgPool → Dense → Dropout → Softmax

    Designed for real-time inference on standard laptop hardware.
    """
    inputs = keras.Input(shape=(*IMG_SIZE, 1), name="stroke_image")

    # ── Block 1 ──────────────────────────────
    x = layers.Conv2D(32, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(32, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)          # 64→32
    x = layers.Dropout(0.2)(x)

    # ── Block 2 ──────────────────────────────
    x = layers.Conv2D(64, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(64, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)          # 32→16
    x = layers.Dropout(0.25)(x)

    # ── Block 3 ──────────────────────────────
    x = layers.Conv2D(128, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(128, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)          # 16→8
    x = layers.Dropout(0.3)(x)

    # ── Block 4 ──────────────────────────────
    x = layers.Conv2D(256, (3, 3), padding="same",
                      kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D((2, 2))(x)          # 8→4
    x = layers.Dropout(0.3)(x)

    # ── Classification Head ───────────────────
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(256, activation="relu",
                     kernel_regularizer=regularizers.l2(1e-4))(x)
    x = layers.Dropout(DROPOUT_RATE)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = keras.Model(inputs, outputs, name="AirWrite_CNN")
    return model


def build_cnn_lstm_model(num_classes: int, seq_len: int = 8) -> keras.Model:
    """
    CNN + BiLSTM hybrid for sequential / multi-stroke characters.
    Input: sequence of stroke frames (seq_len, H, W, 1).
    This is the enhanced model referenced in section 5.5.1 of your proposal.
    """
    inputs = keras.Input(shape=(seq_len, *IMG_SIZE, 1), name="stroke_sequence")

    # Shared CNN feature extractor applied per time step
    cnn_base = keras.Sequential([
        layers.Conv2D(32, (3, 3), activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(64, (3, 3), activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Conv2D(128, (3, 3), activation="relu", padding="same"),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),
    ], name="cnn_feature_extractor")

    # Apply CNN across time axis
    x = layers.TimeDistributed(cnn_base)(inputs)

    # BiLSTM captures stroke ordering / direction
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True))(x)
    x = layers.Bidirectional(layers.LSTM(64))(x)

    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(DROPOUT_RATE)(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="predictions")(x)

    model = keras.Model(inputs, outputs, name="AirWrite_CNN_BiLSTM")
    return model


# ─────────────────────────────────────────────
# 3. TRAINING
# ─────────────────────────────────────────────

def train(model: keras.Model, train_gen, val_gen, class_weight=None):
    """Compile and fit the model with callbacks."""

    early_patience = 5 if FAST_MODE else 12
    histogram_freq = 0 if FAST_MODE else 1

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss=keras.losses.CategoricalCrossentropy(label_smoothing=0.05),
        metrics=[
            "accuracy",
            keras.metrics.TopKCategoricalAccuracy(
                k=3,
                name="top3_acc"
            ),
        ],
    )

    model.summary()

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=early_patience,
            restore_best_weights=True,
            verbose=1,
        ),

        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=max(2, early_patience // 2),
            min_lr=1e-6,
            verbose=1,
        ),

        ModelCheckpoint(
            filepath=MODEL_SAVE_PATH,
            monitor="val_accuracy",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),

        TensorBoard(
            log_dir=LOG_DIR,
            histogram_freq=histogram_freq,
        ),
    ]

    try:
        history = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=EPOCHS,
            callbacks=callbacks,
            class_weight=class_weight,
            verbose=1,
        )

        return history

    except Exception as e:
        print("\n[ERROR] Training failed")
        print(type(e).__name__, ":", e)
        raise

# ─────────────────────────────────────────────
# 4. EVALUATION & VISUALISATION
# ─────────────────────────────────────────────

def plot_training_history(history, save_path="training_curves.png"):
    """Plot accuracy and loss curves and save to file."""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Accuracy
    axes[0].plot(history.history["accuracy"], label="Train Acc", color="#2ecc71")
    axes[0].plot(history.history["val_accuracy"], label="Val Acc", color="#e74c3c")
    axes[0].set_title("Model Accuracy", fontsize=14, fontweight="bold")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Accuracy")
    axes[0].legend()
    axes[0].grid(alpha=0.3)

    # Loss
    axes[1].plot(history.history["loss"], label="Train Loss", color="#3498db")
    axes[1].plot(history.history["val_loss"], label="Val Loss", color="#e67e22")
    axes[1].set_title("Model Loss", fontsize=14, fontweight="bold")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Loss")
    axes[1].legend()
    axes[1].grid(alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150)
    plt.show()
    print(f"[INFO] Training curves saved -> {save_path}")


def evaluate_model(model: keras.Model, val_gen, save_cm_path="confusion_matrix.png"):
    """Full evaluation: classification report + confusion matrix heatmap."""
    print("\n[INFO] Running evaluation on validation set...")
    val_gen.reset()
    y_pred_probs = model.predict(val_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = val_gen.classes

    labels = list(val_gen.class_indices.keys())

    print("\n── Classification Report ──────────────────────────────")
    print(classification_report(y_true, y_pred, target_names=labels))

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(16, 14))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=labels, yticklabels=labels,
        linewidths=0.4, ax=ax,
    )
    ax.set_xlabel("Predicted", fontsize=12)
    ax.set_ylabel("True", fontsize=12)
    ax.set_title("Confusion Matrix — Air-Writing CNN", fontsize=14, fontweight="bold")
    plt.tight_layout()
    plt.savefig(save_cm_path, dpi=150)
    plt.show()
    print(f"[INFO] Confusion matrix saved -> {save_cm_path}")

    val_loss, val_acc, val_top3 = model.evaluate(val_gen, verbose=0)
    print(f"\n[RESULT] Val Accuracy : {val_acc*100:.2f}%")
    print(f"[RESULT] Val Top-3 Acc: {val_top3*100:.2f}%")
    print(f"[RESULT] Val Loss     : {val_loss:.4f}")


# ─────────────────────────────────────────────
# 5. EXPORT FOR DEPLOYMENT
# ─────────────────────────────────────────────

def export_model(model: keras.Model):
    """
    Export in multiple formats:
      - .h5  (Keras — for Python backend / Flask / FastAPI)
      - SavedModel (TensorFlow Serving / Node.js tfjs-node)
      - TFLite (for mobile / lightweight edge deployment)
    """
    # SavedModel format (Keras 3 requires export() for directory SavedModel)
    if hasattr(model, "export"):
        model.export("air_write_saved_model")
    else:
        tf.saved_model.save(model, "air_write_saved_model")
    print("[EXPORT] SavedModel -> air_write_saved_model/")

    # TFLite (for potential mobile app integration)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]  # quantisation for speed
    tflite_model = converter.convert()
    with open("air_write_model.tflite", "wb") as f:
        f.write(tflite_model)
    print("[EXPORT] TFLite    -> air_write_model.tflite")

    # TF.js (for browser / MERN frontend direct inference)
    try:
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, "air_write_tfjs")
        print("[EXPORT] TF.js     -> air_write_tfjs/")
    except ImportError:
        print("[SKIP]  TF.js export skipped (pip install tensorflowjs to enable)")


# ─────────────────────────────────────────────
# 6. USING EMNIST AS A STARTER DATASET
# ─────────────────────────────────────────────

def train_on_emnist(dataset_name: str = TFDS_DATASET):
    """
    If you don't have your own dataset yet, this function bootstraps training
    on EMNIST BYCLASS filtered to digits (0-9) + uppercase letters (A-Z)
    so class count matches NUM_CLASSES=36.

    Replace with your custom air-writing dataset for best accuracy.

    Install: pip install tensorflow-datasets
    """
    try:
        import tensorflow_datasets as tfds
    except ImportError:
        print("[ERROR] Run: pip install tensorflow-datasets")
        return

    print(f"[INFO] Loading TFDS dataset: {dataset_name}")
    print("[INFO] Filtering to labels 0-35 (digits + uppercase A-Z)...")

    def preprocess(image, label):
        image = tf.cast(image, tf.float32) / 255.0
        image = tf.image.resize(image, IMG_SIZE)
        label = tf.one_hot(label, NUM_CLASSES)
        return image, label

    ds_train, ds_val = tfds.load(
        dataset_name,
        split=["train", "test"],
        as_supervised=True,
    )

    # Keep only labels 0-35:
    #   0-9  => digits
    #   10-35 => uppercase A-Z
    ds_train = ds_train.filter(lambda image, label: label < NUM_CLASSES)
    ds_val   = ds_val.filter(lambda image, label: label < NUM_CLASSES)

    if FAST_MODE:
        ds_train = ds_train.take(FAST_TRAIN_SAMPLES)
        ds_val = ds_val.take(FAST_VAL_SAMPLES)
        print(f"[INFO] FAST_MODE enabled: train={FAST_TRAIN_SAMPLES}, val={FAST_VAL_SAMPLES}")

    ds_train = (ds_train
                .map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)
                .shuffle(5000 if FAST_MODE else 10000)
                .batch(BATCH_SIZE)
                .prefetch(tf.data.AUTOTUNE))

    ds_val = (ds_val
              .map(preprocess, num_parallel_calls=tf.data.AUTOTUNE)
              .batch(BATCH_SIZE)
              .prefetch(tf.data.AUTOTUNE))

    model = build_cnn_model(NUM_CLASSES)

    # Persist a fallback mapping for the demo path.
    save_class_mapping({name: idx for idx, name in enumerate(CLASS_NAMES)})

    model.compile(
        optimizer=keras.optimizers.Adam(LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.summary()

    callbacks = [
        EarlyStopping(
            monitor="val_accuracy",
            patience=4 if FAST_MODE else 10,
            restore_best_weights=True,
        ),
        ModelCheckpoint(MODEL_SAVE_PATH, monitor="val_accuracy", save_best_only=True, save_weights_only=False),
    ]

    history = model.fit(ds_train, validation_data=ds_val,
                        epochs=EPOCHS, callbacks=callbacks)
    plot_training_history(history)
    export_model(model)
    return model


def train_on_hybrid(dataset_name: str = TFDS_DATASET, local_dir: str = DATA_DIR):
    """
    Hybrid training: combine EMNIST (0-9 + A-Z) with your local gesture dataset.

    Why this helps:
      - EMNIST gives broad class coverage and strong priors.
      - Your local samples adapt the model to your own hand style and camera setup.
    """
    try:
        import tensorflow_datasets as tfds
    except ImportError:
        print("[ERROR] Run: pip install tensorflow-datasets")
        return

    print(f"[INFO] Loading TFDS dataset: {dataset_name}")
    ds_train, ds_val = tfds.load(
        dataset_name,
        split=["train", "test"],
        as_supervised=True,
    )

    # Keep EMNIST labels 0-35: digits + uppercase A-Z.
    ds_train = ds_train.filter(lambda image, label: label < NUM_CLASSES)
    ds_val = ds_val.filter(lambda image, label: label < NUM_CLASSES)

    if FAST_MODE:
        ds_train = ds_train.take(FAST_TRAIN_SAMPLES)
        ds_val = ds_val.take(FAST_VAL_SAMPLES)
        print(f"[INFO] FAST_MODE enabled: train={FAST_TRAIN_SAMPLES}, val={FAST_VAL_SAMPLES}")

    def preprocess_emnist(image, label):
        image = tf.cast(image, tf.float32) / 255.0
        image = tf.image.resize(image, IMG_SIZE)
        image = tf.where(image > 0.10, image, 0.0)
        label = tf.one_hot(label, NUM_CLASSES)
        return image, label

    ds_train = ds_train.map(preprocess_emnist, num_parallel_calls=tf.data.AUTOTUNE)
    ds_val = ds_val.map(preprocess_emnist, num_parallel_calls=tf.data.AUTOTUNE)

    local_paths, local_labels = index_local_samples(local_dir)
    tr_paths, tr_labels, va_paths, va_labels = _split_local_paths(local_paths, local_labels)

    local_train = _build_local_tf_dataset(tr_paths, tr_labels, training=True)
    local_val = _build_local_tf_dataset(va_paths, va_labels, training=False)

    print(
        f"[INFO] Local split: train={len(tr_paths)} samples, val={len(va_paths)} samples"
    )

    if local_train is not None:
        # Repeat local data so user-style gestures influence each epoch more.
        local_train = local_train.repeat(LOCAL_OVERSAMPLE_FACTOR)
        ds_train = ds_train.concatenate(local_train)
    if local_val is not None:
        ds_val = ds_val.concatenate(local_val)

    ds_train = (ds_train
                .shuffle(5000 if FAST_MODE else 12000)
                .batch(BATCH_SIZE)
                .prefetch(tf.data.AUTOTUNE))

    ds_val = (ds_val
              .batch(BATCH_SIZE)
              .prefetch(tf.data.AUTOTUNE))

    # Preserve stable inference label order.
    save_class_mapping({name: idx for idx, name in enumerate(CLASS_NAMES)})

    model = build_cnn_model(NUM_CLASSES)
    history = _train_with_tf_dataset(model, ds_train, ds_val)

    plot_training_history(history)
    export_model(model)

    val_metrics = model.evaluate(ds_val, verbose=0)
    if len(val_metrics) >= 3:
        print(f"[RESULT] Val Accuracy : {val_metrics[1] * 100:.2f}%")
        print(f"[RESULT] Val Top-3 Acc: {val_metrics[2] * 100:.2f}%")
    else:
        print(f"[RESULT] Val metrics   : {val_metrics}")

    return model


# ─────────────────────────────────────────────
# MAIN ENTRY POINT
# ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Air-Writing Recognition System — CNN Trainer")
    print("  Far-Western University, School of Engineering")
    print("=" * 60)

    # GPU check
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        print(f"[INFO] GPU detected: {gpus}")
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    else:
        print("[INFO] No GPU found — training on CPU (slower but works fine)")

    if DATA_SOURCE.lower() == "tfds":
        print("[INFO] DATA_SOURCE=tfds → using online dataset API")
        train_on_emnist(TFDS_DATASET)
        return

    if DATA_SOURCE.lower() == "hybrid":
        print("[INFO] DATA_SOURCE=hybrid → combining EMNIST + local dataset")
        if not os.path.exists(DATA_DIR):
            print(f"[WARNING] Local dataset '{DATA_DIR}' not found. Continuing with EMNIST only.")
        train_on_hybrid(TFDS_DATASET, DATA_DIR)
        return

    # Check if dataset exists; fall back to EMNIST demo if not
    if not os.path.exists(DATA_DIR):
        print(f"\n[WARNING] Dataset folder '{DATA_DIR}' not found.")
        print("[INFO] Falling back to EMNIST byclass (filtered to 0-9 + A-Z).")
        print("[INFO] Replace DATA_DIR with your custom air-writing dataset for best results.\n")
        train_on_emnist(TFDS_DATASET)
        return

    # ── Load data using robust loader ─────────────────────────────
    from robust_dataset import create_robust_dataset

    if USE_FULL_DATASET_SPLIT:
        from robust_dataset import create_robust_datasets
        train_dataset, val_dataset, class_names, num_classes, train_count, val_count = create_robust_datasets(
            DATA_DIR,
            validation_split=0.2,
            batch_size=BATCH_SIZE,
            augment=True,
        )
    else:
        train_dataset, class_names, num_classes = create_robust_dataset(
            DATA_DIR,
            subset="training",
            validation_split=0.2,
            img_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
        )
        val_dataset, _, _ = create_robust_dataset(
            DATA_DIR,
            subset="validation",
            validation_split=0.2,
            img_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
        )
        train_count = 0
        val_count = 0
    
    # Get metadata
    class_indices = {name: idx for idx, name in enumerate(class_names)}
    train_samples = train_count if train_count else "full split"
    val_samples = val_count if val_count else "full split"
    
    print(f"\n[INFO] Classes detected ({num_classes}): {class_names}")
    print(f"[INFO] Training samples : {train_samples}")
    print(f"[INFO] Validation samples: {val_samples}\n")
    save_class_mapping(class_indices)
    class_weight = compute_class_weights(DATA_DIR)

    # ── Build model ────────────────────────────
    if USE_LSTM_BRANCH:
        print("[INFO] Building CNN + BiLSTM model...")
        model = build_cnn_lstm_model(num_classes)
    else:
        print("[INFO] Building CNN model...")
        model = build_cnn_model(num_classes)

    # ── Train ──────────────────────────────────
    history = train(model, train_dataset, val_dataset, class_weight=class_weight)

    # ── Evaluate ───────────────────────────────
    plot_training_history(history)
    # evaluate_model(model, val_dataset_new)  # Skip for now - works with datasets differently

    # ── Export ─────────────────────────────────
    export_model(model)

    print("\n[DONE] Training complete. Model saved to:", MODEL_SAVE_PATH)


if __name__ == "__main__":
    main()
