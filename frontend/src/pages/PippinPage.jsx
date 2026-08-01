import { useEffect, useReducer, useRef, useState } from 'react'
import { Image, Mic, PawPrint, RotateCcw, ShieldCheck, Square } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InteractiveSessionShell from '../components/interactive/InteractiveSessionShell'
import { createSession, sessionReducer } from '../features/interactive/sessionEngine'
import { appendLocalHistory, getPippinResponse, matchPippinIntent, toPippinReport } from '../features/pippin/pippinLogic'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { interactiveSessionsAPI } from '../services/api'
import { useInteractionSettingsStore } from '../store/interactionSettingsStore'

const PIPPIN_ACTIVITY = { id: 'pippin', type: 'pippin', steps: [{ id: 'play', responseMode: 'touch', reward: 1 }] }
const COMMAND_PAIRS = [
  [{ intent: 'hello', label: 'Hello', icon: '👋' }, { intent: 'ball', label: 'Ball', icon: '🔵' }],
  [{ intent: 'jump', label: 'Jump', icon: '⬆️' }, { intent: 'dance', label: 'Dance', icon: '🎵' }],
  [{ intent: 'amma', label: 'Amma', icon: '💛' }, { intent: 'appa', label: 'Appa', icon: '💙' }],
  [{ intent: 'a', label: 'A', icon: 'அ' }, { intent: 'aa', label: 'Aa', icon: 'ஆ' }],
  [{ intent: 'la', label: 'La', icon: 'ல' }, { intent: 'eat', label: 'Eat', icon: '🍎' }],
]

export default function PippinPage() {
  const navigate = useNavigate()
  const [session, dispatch] = useReducer(sessionReducer, PIPPIN_ACTIVITY, createSession)
  const [mode, setMode] = useState('voice')
  const [history, setHistory] = useState([])
  const [notice, setNotice] = useState('Tap the microphone and say a word')
  const [action, setAction] = useState('idle')
  const [pairIndex, setPairIndex] = useState(0)
  const [petCount, setPetCount] = useState(0)
  const startedAtRef = useRef(Date.now())
  const pendingSpeechRef = useRef(false)
  const interactionRef = useRef(0)
  const independentRef = useRef(0)
  const visualRef = useRef(0)
  const { preferences } = useInteractionSettingsStore()
  const { isRecording, transcript, startRecording, stopRecording, resetRecording } = useAudioRecorder()

  useEffect(() => {
    dispatch({ type: 'START', at: Date.now() })
    dispatch({ type: 'PROMPT_FINISHED', at: Date.now() })
    return () => {
      resetRecording()
      window.speechSynthesis?.cancel()
    }
  }, [resetRecording])

  const speak = (text) => {
    if (!preferences.soundEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = preferences.sessionPace === 'guided' ? 0.88 : 1
    utterance.pitch = 1.12
    utterance.lang = 'en-IN'
    window.speechSynthesis.speak(utterance)
  }

  const interact = (text, source = 'voice', forcedIntent) => {
    const intent = forcedIntent || matchPippinIntent(text)
    const response = getPippinResponse(intent, text)
    const item = { id: `${Date.now()}-${interactionRef.current}`, intent, heard: text, response, source }
    interactionRef.current += 1
    if (source === 'voice') independentRef.current += 1
    else visualRef.current += 1
    setHistory((current) => appendLocalHistory(current, item))
    setNotice(response)
    setAction(intent)
    speak(response)
    window.setTimeout(() => setAction('idle'), 1800)
    dispatch({ type: 'BEGIN_ATTEMPT', at: Date.now() })
    dispatch({ type: 'RESPONSE_CAPTURED', response: { intent }, at: Date.now() })
    dispatch({ type: 'EVALUATION_SUCCEEDED', assistance: source === 'voice' ? 'independent' : 'visual_prompt', at: Date.now() })
  }

  useEffect(() => {
    if (isRecording || !pendingSpeechRef.current) return
    pendingSpeechRef.current = false
    if (transcript.trim()) interact(transcript.trim(), 'voice')
    else {
      setNotice('I did not catch a word. Try a picture instead!')
      setMode('pictures')
    }
    resetRecording()
  }, [isRecording, resetRecording, transcript])

  const startListening = async () => {
    setNotice('Pippin is listening…')
    const allowed = await startRecording('ta-IN', { speechRecognition: true, repeatRecognized: false })
    if (!allowed) {
      setNotice('Microphone is unavailable. Choose a picture word!')
      setMode('pictures')
    }
  }

  const finishListening = () => {
    pendingSpeechRef.current = true
    stopRecording()
  }

  const choosePicture = (command) => {
    interact(command.label, 'picture', command.intent)
    setPairIndex((current) => (current + 1) % COMMAND_PAIRS.length)
  }

  const petPippin = () => {
    const next = petCount + 1
    setPetCount(next)
    setAction('pet')
    setNotice(next % 2 ? 'That gentle pat feels lovely!' : 'Pippin is purring for you.')
    window.setTimeout(() => setAction('idle'), 900)
  }

  const resetLocal = () => {
    setHistory([])
    setNotice('Local history cleared. Ready for a new word!')
    interactionRef.current = 0
    independentRef.current = 0
    visualRef.current = 0
    startedAtRef.current = Date.now()
    resetRecording()
  }

  const leave = () => {
    const completedAt = Date.now()
    const compactHistory = toPippinReport(history)
    if (compactHistory.length) {
      interactiveSessionsAPI.create({
        activity_id: 'pippin',
        activity_type: 'pippin',
        started_at: new Date(startedAtRef.current).toISOString(),
        completed_at: new Date(completedAt).toISOString(),
        communication_turns: compactHistory.length,
        successful_turns: compactHistory.length,
        attempts: compactHistory.length,
        assistance_counts: { independent: independentRef.current, verbal_prompt: 0, visual_prompt: visualRef.current, modelled: 0, skipped: 0 },
        duration_ms: Math.min(3_600_000, completedAt - startedAtRef.current),
        effort_points: compactHistory.length * 2,
      }).catch(() => {})
    }
    navigate('/play')
  }

  const pair = COMMAND_PAIRS[pairIndex]
  return (
    <InteractiveSessionShell title="Play with Pippin" subtitle="Talk, tap, and practise friendly words" state={session} dispatch={dispatch} onExit={leave}>
      <div className="pippin-wrap">
        <section className="pippin-stage">
          <div className="pippin-speech" role="status" aria-live="polite">{notice}</div>
          <button className={`pippin-pet pippin-pet--${action}`} type="button" onClick={petPippin} aria-label="Give Pippin a gentle pat">
            <span className="pippin-pet__sparkles" aria-hidden="true">✦ · ✦</span>
            <img src="/assets/interactive/pippin-mascot.png" alt="Pippin, a cheerful orange kitten wearing a blue scarf" />
          </button>
          <span className="pippin-pat-hint"><PawPrint aria-hidden="true" /> Tap Pippin for a gentle pat</span>
        </section>

        <section className="pippin-panel" aria-label="Talk to Pippin">
          <div className="pippin-mode" role="group" aria-label="Choose input method">
            <button className={mode === 'voice' ? 'is-active' : ''} type="button" onClick={() => setMode('voice')}><Mic aria-hidden="true" /> Voice</button>
            <button className={mode === 'pictures' ? 'is-active' : ''} type="button" onClick={() => setMode('pictures')}><Image aria-hidden="true" /> Pictures</button>
          </div>

          {mode === 'voice' ? (
            <div className="pippin-primary-action">
              <button className={`interactive-control pippin-mic ${isRecording ? 'is-listening' : ''}`} type="button" onClick={isRecording ? finishListening : startListening}>
                {isRecording ? <Square aria-hidden="true" /> : <Mic aria-hidden="true" />}
              </button>
              <strong>{isRecording ? 'Tap when finished' : 'Say a word to Pippin'}</strong>
              <span>Try hello, ball, amma, appa, jump, or any short word.</span>
            </div>
          ) : (
            <div className="pippin-picture-pair">
              {pair.map((command) => (
                <button className="interactive-control pippin-command" type="button" key={command.intent} onClick={() => choosePicture(command)}>
                  <span aria-hidden="true">{command.icon}</span><strong>{command.label}</strong>
                </button>
              ))}
            </div>
          )}

          <div className="pippin-privacy"><ShieldCheck aria-hidden="true" /> Words stay in this tab. The progress report stores counts only.</div>
          {history.length ? (
            <details className="pippin-history">
              <summary>Recent local words ({history.length})</summary>
              <ul>{history.map((item) => <li key={item.id}><span>{item.source === 'picture' ? 'Picture' : 'You'}</span><strong>{item.heard}</strong><small>Pippin: {item.response}</small></li>)}</ul>
              <button type="button" onClick={resetLocal}><RotateCcw aria-hidden="true" /> Clear local history</button>
            </details>
          ) : null}
        </section>
      </div>
    </InteractiveSessionShell>
  )
}
