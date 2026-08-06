import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { Circle, CheckCircle2, AlertCircle, Mic, Square, Lightbulb, Volume2 } from 'lucide-react'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { useFaceDetection } from '../../hooks/useFaceDetection'
import { evaluationAPI } from '../../services/api'
import { useTherapyStore } from '../../store/therapyStore'
import toast from 'react-hot-toast'
import { repeatPhrase } from '../../utils/speechRepeat'
import { getPippinTargetText } from '../../features/pippin/trainingPippin'
import { convertAudioBlobToWav } from '../../utils/audioWav'

const MAX_ATTEMPTS = 3
const SUCCESS_THRESHOLD = 70

function getOutcomeHeading(result, passed) {
  if (passed) return 'Great! Pippin heard the sound clearly.'
  switch (result?.validation_status) {
    case 'recognizer_unavailable':
    case 'processing_error':
      return 'The voice checker is unavailable. Your pronunciation was not graded.'
    case 'no_speech':
      return 'The microphone did not hear a clear voice.'
    case 'duration_mismatch':
      return 'Good sound. Hold it for the shown length and try again.'
    default:
      return "Good try! Let's say it once more."
  }
}

// ─────────────────────────────────────────────────
// Live microphone waveform (real Web Audio frequency data)
// ─────────────────────────────────────────────────
function LiveWaveform({ analyserRef, active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    let raf
    const BARS = 48
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      const analyser = analyserRef?.current
      const barWidth = w / BARS

      const grad = ctx.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, '#6366F1')
      grad.addColorStop(0.5, '#06B6D4')
      grad.addColorStop(1, '#22C55E')
      ctx.fillStyle = grad

      if (analyser && active) {
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        const step = Math.floor(data.length / BARS) || 1
        for (let i = 0; i < BARS; i++) {
          const v = data[i * step] / 255
          const barH = Math.max(3, v * h * 0.95)
          const x = i * barWidth
          const r = (barWidth - 2) / 2
          ctx.beginPath()
          ctx.roundRect(x + 1, (h - barH) / 2, barWidth - 2, barH, r)
          ctx.fill()
        }
      } else {
        // gentle idle pulse line
        for (let i = 0; i < BARS; i++) {
          const barH = 3
          const x = i * barWidth
          ctx.globalAlpha = 0.35
          ctx.beginPath()
          ctx.roundRect(x + 1, (h - barH) / 2, barWidth - 2, barH, 1.5)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [analyserRef, active])

  return <canvas ref={canvasRef} width={520} height={72} className="w-full h-16" />
}

// ─────────────────────────────────────────────────
// Volume / tone meter — too soft · just right · too loud
// ─────────────────────────────────────────────────
function VolumeMeter({ level }) {
  const pct = Math.min(100, Math.round(level * 140))
  const zone = pct < 25 ? 'soft' : pct > 80 ? 'loud' : 'good'
  const label = zone === 'soft' ? 'Too soft' : zone === 'loud' ? 'Too loud' : 'Just right'
  const color = zone === 'good' ? 'text-accent-600' : 'text-gold-600'
  return (
    <div className="flex items-center gap-3">
      <Volume2 className="w-4 h-4 text-neutral-400 shrink-0" />
      <div className="relative flex-1 h-3 rounded-full bg-neutral-200 overflow-hidden">
        {/* zone guides */}
        <div className="absolute inset-y-0 left-[25%] w-px bg-white/70" />
        <div className="absolute inset-y-0 left-[80%] w-px bg-white/70" />
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 via-green-500 to-amber-500"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.12 }}
        />
      </div>
      <span className={`text-xs font-bold w-16 text-right ${color}`}>{label}</span>
    </div>
  )
}

export default function Slide3_Evaluation({ lesson, onNext, onPrev, onCoachStateChange }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [evaluationResult, setEvaluationResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [hasSuccess, setHasSuccess] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [successBurst, setSuccessBurst] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const [isFallbackRepeating, setIsFallbackRepeating] = useState(false)
  const fallbackRepeatTimerRef = useRef(null)
  const repeatedBlobRef = useRef(null)
  const evaluationInFlightRef = useRef(null)
  const transcriptRef = useRef('')

  const { addSessionResult } = useTherapyStore()
  const { isRecording, isRepeating, audioBlob, duration, transcript, analyserRef, startRecording, stopRecording, resetRecording } = useAudioRecorder()
  const { faceData, startDetection, stopDetection } = useFaceDetection(videoRef, canvasRef)

  useEffect(() => {
    transcriptRef.current = transcript
  }, [transcript])

  // Start camera (video only — audio is owned by the recorder hook)
  useEffect(() => {
    let mediaStream
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then((s) => {
        mediaStream = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          setStream(s)
          startDetection()
        }
      })
      .catch((error) => {
        console.error('Camera error:', error)
        toast.error('Could not access camera')
      })

    return () => {
      stopDetection()
      if (mediaStream) mediaStream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // Poll the analyser for the volume meter while recording (cheap, ~12fps)
  useEffect(() => {
    if (!isRecording) {
      setMicLevel(0)
      return
    }
    const id = setInterval(() => {
      const analyser = analyserRef?.current
      if (!analyser) return
      const data = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setMicLevel(avg / 255)
    }, 80)
    return () => clearInterval(id)
  }, [isRecording, analyserRef])

  // Auto-reveal a hint once the child has struggled twice
  useEffect(() => {
    if (failedAttempts >= 2 && !hasSuccess) setShowHint(true)
  }, [failedAttempts, hasSuccess])

  useEffect(() => {
    const passed = evaluationResult && (evaluationResult.phoneme_match || evaluationResult.accuracy >= SUCCESS_THRESHOLD)
    onCoachStateChange?.({
      isRecording,
      isRepeating: isRepeating || isFallbackRepeating,
      isAnalyzing,
      hasRecording: Boolean(audioBlob),
      outcome: evaluationResult ? (passed ? 'success' : 'retry') : null,
      audioLevel: micLevel,
    })
  }, [audioBlob, evaluationResult, isAnalyzing, isFallbackRepeating, isRecording, isRepeating, micLevel, onCoachStateChange])

  const handleSubmit = useCallback(async (recording = audioBlob) => {
    if (!recording) {
      toast.error('No recording available')
      return
    }
    if (evaluationInFlightRef.current === recording) return

    evaluationInFlightRef.current = recording
    setIsAnalyzing(true)
    try {
      const evaluationAudio = await convertAudioBlobToWav(recording)
      const formData = new FormData()
      formData.append('audio', evaluationAudio, 'recording.wav')
      formData.append('target_phoneme', lesson.phoneme)
      formData.append('lesson_id', lesson.id)
      formData.append('browser_transcript', transcriptRef.current.trim().slice(0, 64))

      const response = await evaluationAPI.evaluateSpeech(formData)
      const result = response.data

      setEvaluationResult(result)
      addSessionResult({ ...result, duration_ms: duration })
      setAttempts((a) => a + 1)

      const passed = result.phoneme_match || (result.accuracy >= SUCCESS_THRESHOLD)
      if (passed) {
        setHasSuccess(true)
        setSuccessBurst(true)
        setTimeout(() => setSuccessBurst(false), 4000)
        repeatPhrase('Very good!', { lang: 'en-IN' })
      } else {
        setFailedAttempts((f) => f + 1)
      }
    } catch (error) {
      evaluationInFlightRef.current = null
      console.error('Evaluation error:', error)
      toast.error('Evaluation failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setIsAnalyzing(false)
    }
  }, [addSessionResult, audioBlob, duration, lesson.id, lesson.phoneme])

  useEffect(() => () => window.clearTimeout(fallbackRepeatTimerRef.current), [])

  useEffect(() => {
    if (!audioBlob || isRecording || evaluationResult || repeatedBlobRef.current === audioBlob) return
    repeatedBlobRef.current = audioBlob
    window.clearTimeout(fallbackRepeatTimerRef.current)
    setIsFallbackRepeating(true)
    let finished = false
    const finishRepeat = () => {
      if (finished) return
      finished = true
      window.clearTimeout(fallbackRepeatTimerRef.current)
      setIsFallbackRepeating(false)
      handleSubmit(audioBlob)
    }
    const repeated = repeatPhrase(getPippinTargetText(lesson), {
      lang: 'en-IN',
      onEnd: finishRepeat,
      onError: finishRepeat,
    })
    if (repeated) fallbackRepeatTimerRef.current = window.setTimeout(finishRepeat, 4000)
    else finishRepeat()
  }, [audioBlob, evaluationResult, handleSubmit, isRecording, lesson])

  const handleRecord = async () => {
    if (!isRecording) {
      const success = await startRecording(lesson.language || 'en-IN', { repeatRecognized: false })
      if (success) toast.success('Listening… speak now!')
    } else {
      stopRecording()
    }
  }

  const handleTryAgain = () => {
    setEvaluationResult(null)
    repeatedBlobRef.current = null
    evaluationInFlightRef.current = null
    resetRecording()
  }

  const canProceed = hasSuccess || attempts >= MAX_ATTEMPTS
  const lastPassed = evaluationResult && (evaluationResult.phoneme_match || evaluationResult.accuracy >= SUCCESS_THRESHOLD)
  const outcomeHeading = getOutcomeHeading(evaluationResult, lastPassed)

  return (
    <div className="h-full flex items-center justify-center p-6 md:p-8 relative">
      {successBurst && <Confetti numberOfPieces={250} recycle={false} gravity={0.25} />}

      <div className="max-w-7xl w-full">
        {/* Target word card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-neutral-700">Your turn! Say it out loud </span>
            <span className="inline-block">🎤</span>
          </h2>
          <div className="inline-flex items-center gap-3 bg-white rounded-2xl px-6 py-3 shadow-md border border-neutral-100">
            <span className="tamil-letter text-4xl font-bold gradient-text">{lesson.symbol}</span>
            <div className="text-left">
              <div className="text-xl font-bold text-neutral-900">{lesson.english}</div>
              <div className="text-xs text-neutral-500 font-medium tracking-wide">
                {(lesson.pronunciation || lesson.phoneme || '').toString().split('').join(' · ')}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Left: camera + mic ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6"
          >
            <div className="relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden mb-4">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-white flex items-center space-x-2">
                <Circle className={`w-3 h-3 ${faceData.faceDetected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                <span className="text-sm">{faceData.faceDetected ? 'Face Detected' : 'No Face'}</span>
              </div>
              {/* Real-time waveform overlay */}
              <div className="absolute bottom-3 left-3 right-3 bg-black/55 backdrop-blur rounded-xl px-3 py-2">
                <LiveWaveform analyserRef={analyserRef} active={isRecording} />
              </div>
            </div>

            {/* Mic button with sonar rings */}
            <div className="flex flex-col items-center py-2">
              <div className="relative flex items-center justify-center mb-3">
                <AnimatePresence>
                  {isRecording && [0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="absolute rounded-full border-2 border-accent-400"
                      initial={{ width: 72, height: 72, opacity: 0.6 }}
                      animate={{ width: 168, height: 168, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
                    />
                  ))}
                </AnimatePresence>
                <motion.button
                  onClick={handleRecord}
                  disabled={isAnalyzing}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative z-10 w-[72px] h-[72px] rounded-full flex items-center justify-center text-white shadow-lg transition-colors disabled:opacity-50 ${
                    isRecording ? 'bg-coral-500' : 'bg-gradient-to-br from-primary to-secondary'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? <Square className="w-7 h-7 fill-white" /> : <Mic className="w-8 h-8" />}
                </motion.button>
              </div>
              <p className="text-sm font-semibold text-center min-h-[20px]">
                {isRecording ? (
                  <span className="text-coral-600 animate-pulse">🎤 Listening… say &quot;{getPippinTargetText(lesson)}&quot;</span>
                ) : isFallbackRepeating ? (
                  <span className="text-secondary-700">Pippin is repeating your sound...</span>
                ) : isAnalyzing ? (
                  <span className="text-primary">Pippin is checking your sound...</span>
                ) : audioBlob && !evaluationResult ? (
                  <span className="text-accent-600">Recording ready for evaluation</span>
                ) : (
                  <span className="text-neutral-500">Tap the mic and say the word</span>
                )}
              </p>
            </div>

            {/* Volume meter */}
            <div className="mt-2 mb-4 px-1">
              <VolumeMeter level={micLevel} />
            </div>

            {/* Evaluate / Try again */}
            <div className="flex gap-3">
              {!evaluationResult ? (
                audioBlob && !isRecording && !isFallbackRepeating && (
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isAnalyzing}
                    className="flex-1 bg-accent-500 hover:bg-accent-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                  >
                    {isAnalyzing ? '⏳ Analyzing…' : '✅ Evaluate'}
                  </button>
                )
              ) : (
                <button
                  onClick={handleTryAgain}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition"
                >
                  🔄 Try Again
                </button>
              )}
            </div>

            {/* Live transcript bubble */}
            <AnimatePresence>
              {(transcript || isRecording) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-4 relative bg-secondary-50 border border-secondary-200 rounded-2xl px-4 py-3"
                >
                  <div className="absolute -top-2 left-6 w-4 h-4 bg-secondary-50 border-l border-t border-secondary-200 rotate-45" />
                  <p className="text-[11px] uppercase tracking-wide text-secondary-600 font-semibold mb-0.5">We hear</p>
                  <p className="font-semibold text-neutral-800 min-h-[24px]">
                    {transcript || <span className="text-neutral-400">…</span>}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Attempt counter */}
            <div className="flex items-center justify-center gap-2 mt-5">
              <span className="text-xs text-neutral-500 font-medium mr-1">
                Attempt {Math.min(attempts + (evaluationResult ? 0 : 1), MAX_ATTEMPTS)} of {MAX_ATTEMPTS}
              </span>
              {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < attempts ? 'bg-primary' : 'bg-neutral-300'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* ── Right: analysis ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-6 relative overflow-hidden"
          >
            <h3 className="text-xl font-bold mb-5">Real-time Analysis</h3>

            {/* Big success / retry stamp */}
            <AnimatePresence>
              {evaluationResult && (
                <motion.div
                  key={lastPassed ? 'pass' : 'retry'}
                  initial={{ scale: 0, rotate: -15, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className={`flex items-center gap-3 rounded-2xl p-4 mb-5 ${
                    lastPassed ? 'bg-accent-50 border-2 border-accent-300' : 'bg-amber-50 border-2 border-amber-300'
                  }`}
                >
                  {lastPassed ? (
                    <CheckCircle2 className="w-10 h-10 text-accent-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-10 h-10 text-amber-500 shrink-0" />
                  )}
                  <div>
                    <p className={`font-bold text-lg ${lastPassed ? 'text-accent-700' : 'text-amber-700'}`}>
                      {outcomeHeading}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {evaluationResult.transcription ? (
                        <span className="font-semibold">"{evaluationResult.transcription}"</span>
                      ) : (
                        <span className="font-semibold">no speech detected</span>
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accuracy */}
            <div className="mb-5">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600">Overall Accuracy</span>
                <span className="text-sm font-bold text-primary">{Math.round(evaluationResult?.accuracy || 0)}%</span>
              </div>
              <div className="h-4 bg-neutral-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${evaluationResult?.accuracy || 0}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            {/* Score breakdown */}
            <div className="space-y-3 mb-5">
              <ScoreBar label="🎯 Pronunciation (GOP)" value={evaluationResult?.gop_score || 0} />
              <ScoreBar label="🔊 Sound Match (MFCC)" value={evaluationResult?.mfcc_score || 0} />
              <ScoreBar label="💨 Breath / Airflow" value={(evaluationResult?.airflow_score || 0) * 100} />
              <ScoreBar label="🗣️ Phoneme Match" value={evaluationResult ? (evaluationResult.phoneme_match ? 100 : 30) : 0} />
            </div>

            {/* Per-syllable breakdown (from real GOP forced alignment) */}
            {evaluationResult?.syllable_scores?.length > 0 && (
              <div className="mb-5">
                <h4 className="font-bold mb-2 flex items-center gap-2 text-sm">
                  <span>🧩</span><span>Syllable Breakdown</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {evaluationResult.syllable_scores.map((s) => {
                    const pct = Math.round((s.gop || 0) * 100);
                    const weak = s.syllable === evaluationResult.weakest_syllable;
                    const tone = pct >= 70
                      ? 'bg-accent/15 text-accent border-accent/30'
                      : pct >= 40
                        ? 'bg-gold-100 text-gold-700 border-gold-300'
                        : 'bg-coral/15 text-coral border-coral/30';
                    return (
                      <div
                        key={s.syllable}
                        className={`px-3 py-1.5 rounded-xl border-2 text-sm font-semibold ${tone} ${weak ? 'ring-2 ring-coral/40' : ''}`}
                        title={weak ? 'Focus on this syllable' : undefined}
                      >
                        {s.syllable} · {pct}%
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback */}
            {evaluationResult ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-5"
              >
                <h4 className="font-bold mb-1 flex items-center gap-2"><span>💡</span><span>Feedback</span></h4>
                <p className="text-neutral-700 leading-relaxed text-sm">{evaluationResult.feedback}</p>
              </motion.div>
            ) : (
              <div className="text-center py-10 text-neutral-400">
                <p>👈 Record your voice to see your analysis</p>
              </div>
            )}

            {/* Auto / manual hint */}
            <AnimatePresence>
              {showHint && lesson.tip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="mt-4 bg-gold-50 border-2 border-gold-200 rounded-2xl p-4 flex gap-3"
                >
                  <Lightbulb className="w-6 h-6 text-gold-500 shrink-0" />
                  <div>
                    <p className="font-bold text-gold-700 text-sm mb-0.5">Here&apos;s a hint!</p>
                    <p className="text-sm text-neutral-700">{lesson.tip}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showHint && failedAttempts > 0 && !hasSuccess && lesson.tip && (
              <button
                onClick={() => setShowHint(true)}
                className="mt-4 w-full py-2.5 rounded-xl border-2 border-gold-200 text-gold-700 font-semibold text-sm hover:bg-gold-50 transition inline-flex items-center justify-center gap-2"
              >
                <Lightbulb className="w-4 h-4" /> Need a hint?
              </button>
            )}
          </motion.div>
        </div>
        {/* Navigation */}
        <div className="flex justify-between mt-7">
          <button
            onClick={onPrev}
            className="px-8 py-3 border-2 border-neutral-300 hover:border-primary text-neutral-700 hover:text-primary rounded-full transition font-semibold bg-white/70"
          >
            ← Back
          </button>

          {canProceed && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              onClick={onNext}
              className="px-10 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full transition font-semibold shadow-lg shadow-primary/30"
            >
              {hasSuccess ? 'Next → 🎉' : 'Continue →'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

function ScoreBar({ label, value }) {
  const v = Math.round(value)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-neutral-600">{label}</span>
        <span className="font-bold text-neutral-800">{v}%</span>
      </div>
      <div className="h-2.5 bg-neutral-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, v)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
