/**
 * Air-Writing Web ↔ Model Integration
 *
 * Bridges liveWriting.jsx (browser canvas + MediaPipe) with:
 *   - Node backend  POST /api/predict, GET /api/predict/health
 *   - Flask ML      POST /predict  (ml_service.py / air_writing_server.py)
 *   - Training      air_writing_cnn_train.py + class_indices.json
 *   - Desktop demo  air_writing_inference.py (same preprocessing contract)
 *
 * Contract: 640×480 PNG, cyan rgb(0,255,255) strokes on black background,
 * base64 payload { image: "<raw base64>" } → { char, confidence, low_confidence }
 */

import api from './axios.js'

// ── Timing (aligned with liveWriting + air_writing_inference.py) ─────────────
export const TIMING = {
  LETTER_PAUSE_MS: 1500,
  WORD_PAUSE_MS: 3000,
  MOVEMENT_THRESHOLD: 6,
}

// ── Canvas (matches training dataset + air_writing_inference STROKE_COLOR) ─
export const CANVAS = {
  WIDTH: 640,
  HEIGHT: 480,
  STROKE_COLOR: 'rgb(0,255,255)',
  LINE_WIDTH: 4,
  BACKGROUND: '#000000',
}

// ── Gesture tuning (ported from air_writing_inference.py) ──────────────────
export const GESTURE = {
  SMOOTHING: 7,
  MIN_MOVE_PX: 2,
  EXTEND_RATIO: 1.08,
  FOLD_RATIO: 0.95,
}

/**
 * Fill canvas with black — required before drawing and before encode.
 * Transparent PNGs break max(R,G,B) preprocessing on the ML side.
 */
export function initBlackCanvas(canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = CANVAS.BACKGROUND
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

/** Clear stroke canvas back to black (not transparent). */
export function clearBlackCanvas(canvas) {
  initBlackCanvas(canvas)
}

/**
 * Copy draw canvas → hidden send canvas (black bg) → raw base64 PNG.
 * Mirrors the export path used by air_writing_inference before model.predict().
 */
export function encodeCanvasForPrediction(drawCanvas, sendCanvas) {
  if (!drawCanvas || !sendCanvas) return null

  const ctx = sendCanvas.getContext('2d')
  initBlackCanvas(sendCanvas)
  ctx.drawImage(drawCanvas, 0, 0)

  const dataUrl = sendCanvas.toDataURL('image/png')
  return dataUrl.split(',')[1]
}

/**
 * Moving-average smoothing for index fingertip (reduces MediaPipe jitter).
 */
export function smoothPoint(history, point, windowSize = GESTURE.SMOOTHING) {
  history.push(point)
  if (history.length > windowSize) history.shift()

  const n = history.length
  const avgX = history.reduce((s, p) => s + p.x, 0) / n
  const avgY = history.reduce((s, p) => s + p.y, 0) / n
  return { x: avgX, y: avgY }
}

/**
 * Gesture states aligned with air_writing_inference.py finger logic.
 * Returns: { indexOnly, isFist, isOpenPalm, point }
 */
export function detectHandGesture(landmarks, canvasWidth, canvasHeight) {
  const lm = landmarks

  const fingerExtended = (tipIdx, pipIdx) => {
    const tip = lm[tipIdx]
    const pip = lm[pipIdx]
    const distTip = Math.hypot(tip.x - lm[0].x, tip.y - lm[0].y)
    const distPip = Math.hypot(pip.x - lm[0].x, pip.y - lm[0].y)
    if (distPip < 1e-6) return tip.y < pip.y
    return distTip / distPip > GESTURE.EXTEND_RATIO && tip.y < pip.y
  }

  const fingerFolded = (tipIdx, pipIdx) => {
    const tip = lm[tipIdx]
    const pip = lm[pipIdx]
    const distTip = Math.hypot(tip.x - lm[0].x, tip.y - lm[0].y)
    const distPip = Math.hypot(pip.x - lm[0].x, pip.y - lm[0].y)
    if (distPip < 1e-6) return tip.y > pip.y
    return distTip / distPip < GESTURE.FOLD_RATIO || tip.y > pip.y
  }

  const indexUp = fingerExtended(8, 6)
  const middleUp = fingerExtended(12, 10)
  const ringUp = fingerExtended(16, 14)
  const pinkyUp = fingerExtended(20, 18)

  const indexOnly = indexUp && !middleUp && !ringUp && !pinkyUp
  const isFist = !indexUp && !middleUp && !ringUp && !pinkyUp
  const isOpenPalm = indexUp && middleUp && ringUp && pinkyUp

  const x = (1 - lm[8].x) * canvasWidth
  const y = lm[8].y * canvasHeight

  return { indexOnly, isFist, isOpenPalm, point: { x, y } }
}

/** Normalise Node + ML response shapes into one object. */
export function parsePredictionResponse(payload) {
  const nested = payload?.data ?? payload
  const result = nested?.data ?? nested

  return {
    char: result?.char ?? null,
    confidence: result?.confidence ?? 0,
    low_confidence: Boolean(result?.low_confidence),
    error: result?.error ?? null,
    top3: result?.top3 ?? null,
  }
}

/** GET /api/predict/health — ML microservice reachable via Node proxy. */
export async function checkMlHealth() {
  const res = await api.get('/predict/health', { withCredentials: true })
  return res.data?.data ?? res.data
}

/**
 * POST /api/predict — stroke image → predicted character.
 * @param {string} base64Image raw base64 PNG (no data: prefix)
 */
export async function predictStroke(base64Image) {
  const res = await api.post('/predict', { image: base64Image }, { withCredentials: true })
  return parsePredictionResponse(res.data)
}

/**
 * POST /api/note — persist recognised word (backend route is singular /note).
 */
export async function saveRecognizedNote({ title, recognizedText }) {
  const res = await api.post(
    '/note',
    { title, recognizedText },
    { withCredentials: true },
  )
  return res.data
}
