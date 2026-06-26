  /**
   * liveWriting.jsx  — Air-Writing Recognition System
   * Far-Western University, School of Engineering
   *
   * HOW IT WORKS:
   *  1. Webcam feed captured via MediaPipe Hands (runs in browser, no Python needed here)
   *  2. Fingertip tracked → cyan strokes drawn on a canvas overlay
   *  3. After 1.5s of no movement → stroke image sent to Node backend POST /api/predict
   *  4. Node backend forwards it to Python ML microservice → returns { char, confidence }
   *  5. Characters are buffered into a word
   *  6. After 4s of no movement (or ✊ fist) → word is finalised and saved via POST /api/notes
   *
   * GESTURES:
   *   ☝️  Index finger extended  →  writing mode (draws cyan stroke)
   *   ✊  Closed fist            →  immediately confirm current letter
   *   Pause 1.5s                →  confirm letter, clear canvas for next
   *   Pause 4s                  →  finish word → save as note
   *
   * BUGS FIXED vs original file:
   *   - navigate was called but useNavigate() was never called → fixed
   *   - All buttons were static, none had any logic → all wired up
   *   - No MediaPipe / webcam / prediction logic existed → fully implemented
   */

  import { useEffect, useRef, useState, useCallback } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { FiSearch } from 'react-icons/fi'
  import { User } from 'lucide-react'
  import jsPDF from 'jspdf'
  import { Hands } from '@mediapipe/hands'
  import { Camera } from '@mediapipe/camera_utils'
  import api from '../api/axios.js'

  // ── Timing constants (ms) ──────────────────────────────
  const LETTER_PAUSE_MS    = 1500   // stillness → confirm this letter
  const WORD_PAUSE_MS      = 3000   // stillness → finish whole word
  const MOVEMENT_THRESHOLD = 6      // px — minimum movement to count as "drawing"

  export default function LiveWriting() {
    const navigate = useNavigate()  // FIX: was missing in original

    // ── Refs (don't re-render on change) ──────────────────
    const videoRef        = useRef(null)
    const drawCanvasRef   = useRef(null)   // visible cyan stroke overlay
    const sendCanvasRef   = useRef(null)   // hidden canvas used to encode image for backend
    const prevPointRef    = useRef(null)
    const letterTimerRef  = useRef(null)
    const wordTimerRef    = useRef(null)
    const hasStrokeRef    = useRef(false)
    const wordBufferRef   = useRef('')     // ref so timers always see latest value
    const sessionStartRef = useRef(null)
    const cameraRef       = useRef(null)
    const handsRef        = useRef(null)

    // ── State (drives UI re-renders) ──────────────────────
    const [isRunning,     setIsRunning]     = useState(false)
    const [handDetected,  setHandDetected]  = useState(false)
    const [serviceStatus, setServiceStatus] = useState('checking')
    const [wordSoFar,     setWordSoFar]     = useState('')
    const [lastChar,      setLastChar]      = useState('')
    const [lastConfidence,setLastConfidence]= useState(null)
    const [recognizedText,setRecognizedText]= useState('')   // full session text
    const [sessionStats,  setSessionStats]  = useState({ chars: 0, words: 0, time: '00:00' })
    const [timerInterval, setTimerInterval] = useState(null)
    const [statusLabel,   setStatusLabel]   = useState('Idle')
    const [savedMsg,      setSavedMsg]      = useState('')

    // ── Check backend health on mount ─────────────────────
    useEffect(() => {
      api.get('/predict/health', { withCredentials: true })
        .then(() => setServiceStatus('online'))
        .catch(() => setServiceStatus('offline'))
    }, [])

    // ── Session timer ─────────────────────────────────────
    const startTimer = useCallback(() => {
      sessionStartRef.current = Date.now()
      const iv = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
        const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
        const s = String(elapsed % 60).padStart(2, '0')
        setSessionStats(prev => ({ ...prev, time: `${m}:${s}` }))
      }, 1000)
      setTimerInterval(iv)
    }, [])

    const stopTimer = useCallback(() => {
      if (timerInterval) clearInterval(timerInterval)
      setTimerInterval(null)
    }, [timerInterval])

    // ── Send current stroke canvas to backend for prediction ──
    const sendStrokeForPrediction = useCallback(async () => {
      const draw = drawCanvasRef.current
      const send = sendCanvasRef.current
      if (!draw || !send || !hasStrokeRef.current) return

      // Copy stroke canvas → hidden canvas → encode as base64 PNG
      const ctx = send.getContext('2d')
      ctx.clearRect(0, 0, send.width, send.height)
      ctx.drawImage(draw, 0, 0)
      const dataUrl = send.toDataURL('image/png')

      // Immediately clear draw canvas so next letter starts fresh
      const dCtx = draw.getContext('2d')
      dCtx.clearRect(0, 0, draw.width, draw.height)
      prevPointRef.current = null
      hasStrokeRef.current = false
      setStatusLabel('Recognising...')

      try {
        const res = await api.post('/predict', { image: dataUrl }, { withCredentials: true })
        const { char, confidence, low_confidence } = res.data.data

        if (!char) { setStatusLabel('Writing'); return }

        const display = low_confidence ? `${char}?` : char
        setLastChar(display)
        setLastConfidence(confidence)
        wordBufferRef.current += char
        setWordSoFar(wordBufferRef.current)
        setSessionStats(prev => ({ ...prev, chars: prev.chars + 1 }))
        setStatusLabel('Writing')
      } catch (err) {
        console.error('Prediction failed:', err)
        setServiceStatus('offline')
        setStatusLabel('Error — backend offline')
      }
    }, [])

    // ── Finalise word → save as note ─────────────────────
    const finishWord = useCallback(async () => {
      const word = wordBufferRef.current.trim()
      if (!word) return

      wordBufferRef.current = ''
      setWordSoFar('')
      setLastChar('')
      setLastConfidence(null)
      setStatusLabel('Saving...')

      const fullText = recognizedText ? recognizedText + ' ' + word : word
      setRecognizedText(fullText)
      setSessionStats(prev => ({ ...prev, words: prev.words + 1 }))

      try {
        await api.post('/notes', {
          title: word,
          recognizedText: fullText,
        }, { withCredentials: true })
        setSavedMsg(`"${word}" saved!`)
        setTimeout(() => setSavedMsg(''), 2500)
      } catch (err) {
        console.error('Save note failed:', err)
      }
      setStatusLabel('Writing')
    }, [recognizedText])

    // ── Reset movement timers on each fingertip move ──────
    const registerMovement = useCallback(() => {
      clearTimeout(letterTimerRef.current)
      clearTimeout(wordTimerRef.current)
      setStatusLabel('Writing')

      letterTimerRef.current = setTimeout(() => {
        sendStrokeForPrediction()
      }, LETTER_PAUSE_MS)

      wordTimerRef.current = setTimeout(() => {
        finishWord()
      }, WORD_PAUSE_MS)
    }, [sendStrokeForPrediction, finishWord])

    // ── Start camera + MediaPipe ───────────────────────────
    const startSession = useCallback(() => {
      const video   = videoRef.current
      const canvas  = drawCanvasRef.current
      if (!video || !canvas) return

      const ctx = canvas.getContext('2d')

      const hands = new Hands({
        locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.75,
        minTrackingConfidence: 0.65,
      })

      hands.onResults(results => {
        const w = canvas.width
        const h = canvas.height

        if (results.multiHandLandmarks?.length > 0) {
          setHandDetected(true)
          const lm = results.multiHandLandmarks[0]

          const indexUp  = lm[8].y < lm[6].y
          const middleUp = lm[12].y < lm[10].y
          const ringUp   = lm[16].y < lm[14].y
          const pinkyUp  = lm[20].y < lm[18].y
          const isFist   = !indexUp && !middleUp && !ringUp && !pinkyUp

          // Mirror x so writing feels natural (selfie view)
          const x = (1 - lm[8].x) * w
          const y = lm[8].y * h

          if (indexUp) {
            setStatusLabel('Writing')
            if (prevPointRef.current) {
              const dx = x - prevPointRef.current.x
              const dy = y - prevPointRef.current.y
              const dist = Math.sqrt(dx * dx + dy * dy)

              // Draw cyan stroke — matches training dataset colour exactly
              ctx.strokeStyle = 'rgb(0,255,255)'
              ctx.lineWidth   = 4
              ctx.lineCap     = 'round'
              ctx.lineJoin    = 'round'
              ctx.beginPath()
              ctx.moveTo(prevPointRef.current.x, prevPointRef.current.y)
              ctx.lineTo(x, y)
              ctx.stroke()
              hasStrokeRef.current = true

              if (dist > MOVEMENT_THRESHOLD) registerMovement()
            } else {
              registerMovement()
            }
            prevPointRef.current = { x, y }
          } else {
            prevPointRef.current = null
          }

          // Fist = immediately confirm current letter (skip the 1.5s wait)
          if (isFist && hasStrokeRef.current) {
            clearTimeout(letterTimerRef.current)
            sendStrokeForPrediction()
          }
        } else {
          setHandDetected(false)
          prevPointRef.current = null
        }
      })

      const camera = new Camera(video, {
        onFrame: async () => { await hands.send({ image: video }) },
        width: 640, height: 480,
      })
      camera.start()
      cameraRef.current = camera
      handsRef.current  = hands

      setIsRunning(true)
      setStatusLabel('Writing')
      startTimer()
    }, [registerMovement, sendStrokeForPrediction, startTimer])

    // ── Stop camera ───────────────────────────────────────
    const stopSession = useCallback(() => {
      cameraRef.current?.stop()
      handsRef.current?.close()
      clearTimeout(letterTimerRef.current)
      clearTimeout(wordTimerRef.current)
      setIsRunning(false)
      setHandDetected(false)
      setStatusLabel('Idle')
      stopTimer()
    }, [stopTimer])

    // ── Cleanup on unmount ────────────────────────────────
    useEffect(() => {
      return () => {
        cameraRef.current?.stop()
        handsRef.current?.close()
        clearTimeout(letterTimerRef.current)
        clearTimeout(wordTimerRef.current)
      }
    }, [])

    // ── Clear canvas ─────────────────────────────────────
    const clearCanvas = () => {
      const canvas = drawCanvasRef.current
      if (!canvas) return
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      hasStrokeRef.current  = false
      prevPointRef.current  = null
      wordBufferRef.current = ''
      setWordSoFar('')
      setLastChar('')
      setLastConfidence(null)
      clearTimeout(letterTimerRef.current)
      clearTimeout(wordTimerRef.current)
    }

    // ── Save current text manually ────────────────────────
    const saveManually = async () => {
      await finishWord()
    }

    // ── Export PDF ────────────────────────────────────────
    const exportPDF = () => {
      const doc  = new jsPDF()
      const text = recognizedText || 'No text yet'
      doc.setFontSize(16)
      doc.text('Air-Writing Session Notes', 14, 18)
      doc.setFontSize(12)
      doc.text(text, 14, 32)
      doc.save('air-writing-session.pdf')
    }

    // ── Status colour ─────────────────────────────────────
    const statusColor = {
      'Idle':             'bg-gray-300',
      'Writing':          'bg-green-400',
      'Recognising...':   'bg-amber-400',
      'Saving...':        'bg-blue-400',
      'Error — backend offline': 'bg-red-400',
    }[statusLabel] || 'bg-gray-300'

    return (
      <div>
        {/* Header */}
        <nav className='h-16 px-4 mb-3 w-full border-b flex items-center justify-between'>
          <div className='flex flex-col text-left'>
            <span className='text-2xl font-medium'>Live Air Writing</span>
            <h4 className='text-gray-700 text-sm'>Write in the air — letters are recognised in real time</h4>
          </div>
          <div className='flex justify-between items-center'>
            <div className='relative flex items-center'>
              <FiSearch className='absolute left-1' size={16} />
              <input type="text" placeholder='search...' className='text-sm border h-8 pl-8 w-23 rounded-md md:w-auto' />
            </div>
            <User onClick={() => navigate('/dashboard/settings')} size={20} className='text-gray-800 ml-4 cursor-pointer' />
          </div>
        </nav>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

            {/* LEFT — main canvas area */}
            <div className="lg:col-span-9">
              <div className="relative h-[560px] rounded-2xl bg-black shadow-md overflow-hidden">

                {/* Status pill */}
                <div className="absolute right-5 top-5 z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`}></span>
                    <span className="text-sm font-medium text-gray-700">{statusLabel}</span>
                  </div>
                </div>

                {/* Service status */}
                <div className="absolute left-5 top-5 z-10 flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${serviceStatus === 'online' ? 'bg-green-600' : serviceStatus === 'offline' ? 'bg-red-600' : 'bg-gray-500'}`}>
                    ML: {serviceStatus}
                  </span>
                  {isRunning && (
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${handDetected ? 'bg-blue-600' : 'bg-gray-500'}`}>
                      {handDetected ? '✋ Hand detected' : 'No hand'}
                    </span>
                  )}
                </div>

                {/* Webcam video */}
                <video
                  ref={videoRef}
                  className={`absolute inset-0 w-full h-full object-cover ${isRunning ? 'opacity-70' : 'opacity-0'} -scale-x-100`}
                  autoPlay playsInline muted
                />

                {/* Stroke canvas */}
                <canvas
                  ref={drawCanvasRef}
                  width={640} height={480}
                  className="absolute inset-0 w-full h-full"
                  style={{ mixBlendMode: 'screen' }}
                />

                {/* Hidden send canvas */}
                <canvas ref={sendCanvasRef} width={640} height={480} className="hidden" />

                {/* Center play button (when idle) */}
                {!isRunning && (
                  <div className="relative flex h-full items-center justify-center">
                    <div className="text-center">
                      <div
                        onClick={startSession}
                        className="mx-auto h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition text-4xl"
                      >
                        ▶
                      </div>
                      <p className="mt-4 text-gray-300">
                        Press <span className="font-semibold text-white">Start</span> to begin writing
                      </p>
                    </div>
                  </div>
                )}

                {/* Word-so-far overlay */}
                {isRunning && wordSoFar && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 px-4 py-2 rounded-xl">
                    <span className="text-white text-xl font-mono tracking-widest">{wordSoFar}</span>
                    {lastChar && (
                      <span className="ml-3 text-cyan-400 text-sm">← {lastChar} {lastConfidence != null ? `(${(lastConfidence*100).toFixed(0)}%)` : ''}</span>
                    )}
                  </div>
                )}

                {/* Saved confirmation */}
                {savedMsg && (
                  <div className="absolute top-16 right-5 z-20 bg-green-600 text-white px-4 py-2 rounded-xl text-sm shadow">
                    {savedMsg}
                  </div>
                )}

                {/* Gesture hint bar */}
                {isRunning && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-gray-300 text-xs px-4 py-1 flex gap-6 justify-center">
                    <span>☝️ Index up = write</span>
                    <span>✊ Fist = confirm letter</span>
                    <span>⏸ Pause 1.5s = next letter</span>
                    <span>⏸ Pause 4s = save word</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — controls + stats */}
            <div className="lg:col-span-3 space-y-6">

              {/* Controls */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-semibold mb-4">Controls</h3>

                {!isRunning ? (
                  <button
                    onClick={startSession}
                    className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold mb-4 hover:bg-green-600 transition"
                  >
                    ▶ Start
                  </button>
                ) : (
                  <button
                    onClick={stopSession}
                    className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold mb-4 hover:bg-red-600 transition"
                  >
                    ■ Stop
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={clearCanvas}
                    className="border rounded-xl py-2 font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    🗑 Clear
                  </button>
                  <button
                    onClick={saveManually}
                    disabled={!wordSoFar}
                    className="border rounded-xl py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                  >
                    💾 Save
                  </button>
                </div>

                <button
                  onClick={exportPDF}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  ⬇ Export PDF
                </button>
              </div>

              {/* Recognized Text */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-semibold mb-3">Recognised Text</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 font-mono min-h-[60px] break-all">
                  {recognizedText || 'Text will appear here...'}
                </div>
                {wordSoFar && (
                  <div className="mt-2 text-xs text-indigo-600 font-mono">
                    Building: <strong>{wordSoFar}</strong>
                  </div>
                )}
              </div>

              {/* Session Stats */}
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h3 className="text-lg font-semibold mb-3">Session Stats</h3>

                <div className="flex justify-between border rounded-xl px-4 py-2 mb-2">
                  <span className="text-gray-500 text-sm">Characters</span>
                  <span className="font-semibold">{sessionStats.chars}</span>
                </div>
                <div className="flex justify-between rounded-xl px-4 py-2 mb-2">
                  <span className="text-gray-500 text-sm">Words</span>
                  <span className="font-semibold">{sessionStats.words}</span>
                </div>
                <div className="flex justify-between rounded-xl px-4 py-2">
                  <span className="text-gray-500 text-sm">Time</span>
                  <span className="font-semibold">{sessionStats.time}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }
