import { useEffect, useReducer, useRef, useState } from 'react'
import { Check, HelpCircle, Mic, Square, Trees, Waves, Wind } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ChildFeedback from '../components/interactive/ChildFeedback'
import InteractiveSessionShell from '../components/interactive/InteractiveSessionShell'
import QuestScene from '../components/interactive/QuestScene'
import {
  RIVER_RESCUE_ACTIVITY,
  buildRiverRescueReport,
  evaluateQuestResponse,
  getQuestCopy,
} from '../features/quest/riverRescueActivity'
import { readAnalyserLevel } from '../features/interactive/audioLevel'
import { createSession, sessionReducer } from '../features/interactive/sessionEngine'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { interactiveSessionsAPI } from '../services/api'
import { useInteractionSettingsStore } from '../store/interactionSettingsStore'

const EMPTY_ASSISTANCE = { independent: 0, verbal_prompt: 0, visual_prompt: 0, modelled: 0, skipped: 0 }

export default function RiverRescuePage() {
  const navigate = useNavigate()
  const [session, dispatch] = useReducer(sessionReducer, RIVER_RESCUE_ACTIVITY, createSession)
  const [mode, setMode] = useState('prompt')
  const [chosenPath, setChosenPath] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [message, setMessage] = useState('Kavi needs a kind helper!')
  const [bridgeProgress, setBridgeProgress] = useState(0)
  const startedAtRef = useRef(Date.now())
  const attemptsRef = useRef(0)
  const successesRef = useRef(0)
  const assistanceRef = useRef({ ...EMPTY_ASSISTANCE })
  const airflowRef = useRef(0)
  const { transcript, isRecording, analyserRef, startRecording, stopRecording, resetRecording } = useAudioRecorder()
  const { preferences } = useInteractionSettingsStore()
  const step = RIVER_RESCUE_ACTIVITY.steps[session.stepIndex] || RIVER_RESCUE_ACTIVITY.steps.at(-1)
  const copy = getQuestCopy(step.id, preferences.ageBand)

  useEffect(() => {
    dispatch({ type: 'START', at: Date.now() })
    dispatch({ type: 'PROMPT_FINISHED', at: Date.now() })
  }, [])

  useEffect(() => {
    if (!preferences.spokenPrompts || !copy?.prompt || !window.speechSynthesis) return undefined
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(copy.prompt)
    utterance.rate = preferences.sessionPace === 'guided' ? 0.85 : 1
    utterance.lang = 'en-IN'
    window.speechSynthesis.speak(utterance)
    return () => window.speechSynthesis.cancel()
  }, [copy?.prompt, preferences.sessionPace, preferences.spokenPrompts])

  useEffect(() => () => resetRecording(), [resetRecording])

  useEffect(() => {
    if (!isRecording || step.responseMode !== 'airflow') return undefined
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const level = readAnalyserLevel(analyserRef.current) * 2.4
      if (level > 0.1) airflowRef.current += now - last
      last = now
      setBridgeProgress(Math.min(1, airflowRef.current / step.targetDurationMs))
    }, 60)
    return () => window.clearInterval(timer)
  }, [analyserRef, isRecording, step.responseMode, step.targetDurationMs])

  const recordAssistance = (level) => {
    assistanceRef.current[level] += 1
  }

  const finishQuest = (lastIndependent = false) => {
    const completedAt = Date.now()
    const assistance = { ...assistanceRef.current }
    if (lastIndependent) assistance.independent += 1
    const report = buildRiverRescueReport({
      startedAt: startedAtRef.current,
      completedAt,
      turns: RIVER_RESCUE_ACTIVITY.steps.length,
      successes: successesRef.current + (lastIndependent ? 1 : 0),
      attempts: attemptsRef.current,
      assistance,
      effortPoints: session.effortPoints + (lastIndependent ? step.reward : 0),
    })
    assistanceRef.current = assistance
    interactiveSessionsAPI.create(report).catch(() => {})
    setMode('complete')
    setMessage('We crossed the river together!')
  }

  const advance = (assistance = 'independent') => {
    const independent = assistance === 'independent'
    if (independent) successesRef.current += 1
    recordAssistance(assistance)
    dispatch({ type: 'EVALUATION_SUCCEEDED', assistance, at: Date.now() })
    if (session.stepIndex >= RIVER_RESCUE_ACTIVITY.steps.length - 1) {
      // Remove the increment already made above so finishQuest can build once.
      if (independent) successesRef.current -= 1
      assistanceRef.current[assistance] -= 1
      finishQuest(independent)
      dispatch({ type: 'COMPLETE', at: Date.now() })
      return
    }
    dispatch({ type: 'NEXT_STEP', at: Date.now() })
    setAttempt(0)
    setMode('prompt')
    setBridgeProgress(0)
    resetRecording()
  }

  const choose = (choice) => {
    attemptsRef.current += 1
    dispatch({ type: 'BEGIN_ATTEMPT', at: Date.now() })
    dispatch({ type: 'RESPONSE_CAPTURED', response: { choice }, at: Date.now() })
    if (step.id === 'choose-path') {
      setChosenPath(choice)
      setMessage(choice === 'forest' ? 'The forest path is full of butterflies!' : 'The river path sparkles in the sun!')
    } else setMessage(choice === 'nandri' ? 'Nandri! Thank you, helper!' : 'Hooray! The bridge is safe!')
    window.setTimeout(() => advance('independent'), 450)
  }

  const beginResponse = async () => {
    attemptsRef.current += 1
    const nextAttempt = attempt + 1
    setAttempt(nextAttempt)
    dispatch({ type: 'BEGIN_ATTEMPT', at: Date.now() })
    if (step.responseMode === 'airflow') airflowRef.current = 0
    const allowed = await startRecording('ta-IN', { speechRecognition: step.responseMode === 'speech' })
    if (!allowed) {
      setMode('support')
      dispatch({ type: 'CAPABILITY_ERROR', capability: 'microphone', message: 'Use the picture help instead.', at: Date.now() })
      return
    }
    setMode('listening')
    setMessage(step.responseMode === 'airflow' ? 'A long, gentle breath lowers the bridge.' : 'Kavi is listening...')
  }

  const checkResponse = () => {
    stopRecording()
    const response = step.responseMode === 'airflow' ? { durationMs: airflowRef.current } : { transcript }
    const result = evaluateQuestResponse(step, response, attempt)
    dispatch({ type: 'RESPONSE_CAPTURED', response: { matched: result.success }, at: Date.now() })
    if (result.success) {
      setMessage(step.id === 'lower-bridge' ? 'The bridge is down!' : 'Kavi heard you!')
      setMode('success')
    } else {
      dispatch({ type: 'EVALUATION_RETRY', at: Date.now() })
      setMode(result.support ? 'support' : 'retry')
      setMessage(result.support ? 'Let us use a helpful picture together.' : 'Kavi is still listening. Every try helps!')
    }
  }

  const useHelp = () => {
    dispatch({ type: 'USE_HINT', assistance: 'visual_prompt', at: Date.now() })
    setMessage('The picture helped Kavi understand!')
    advance('visual_prompt')
  }

  const responseControls = () => {
    if (mode === 'listening') return <button className="interactive-control quest-button quest-button--stop" type="button" onClick={checkResponse}><Square aria-hidden="true" /> {step.responseMode === 'airflow' ? 'Check bridge' : 'I finished'}</button>
    if (mode === 'success') return <button className="interactive-control quest-button quest-button--primary" type="button" onClick={() => advance('independent')}><Check aria-hidden="true" /> Keep going</button>
    if (mode === 'retry') return <><button className="interactive-control quest-button quest-button--primary" type="button" onClick={beginResponse}><Mic aria-hidden="true" /> Try again</button><button className="interactive-control quest-button quest-button--quiet" type="button" onClick={useHelp}><HelpCircle aria-hidden="true" /> Picture help</button></>
    if (mode === 'support') return <><button className="interactive-control quest-button quest-button--primary" type="button" onClick={useHelp}><HelpCircle aria-hidden="true" /> Use picture help</button><button className="interactive-control quest-button quest-button--quiet" type="button" onClick={() => setMode('prompt')}>Try myself</button></>
    return <><button className="interactive-control quest-button quest-button--primary" type="button" onClick={beginResponse}>{step.responseMode === 'airflow' ? <Wind aria-hidden="true" /> : <Mic aria-hidden="true" />} {step.responseMode === 'airflow' ? 'Start breath' : 'Start speaking'}</button><button className="interactive-control quest-button quest-button--quiet" type="button" onClick={useHelp}><HelpCircle aria-hidden="true" /> Picture help</button></>
  }

  return (
    <InteractiveSessionShell title="River Rescue" subtitle="Help Kavi reach the other side" state={session} dispatch={dispatch} steps={RIVER_RESCUE_ACTIVITY.steps}>
      <div className="quest-wrap">
        {mode === 'complete' ? (
          <div className="quest-complete">
            <span>🐘</span>
            <ChildFeedback kind="success" title="River Rescue complete!" detail="Five communication turns helped Kavi cross safely." />
            <button className="interactive-control quest-button quest-button--primary" type="button" onClick={() => navigate('/play')}>Choose another adventure</button>
          </div>
        ) : (
          <QuestScene stepId={step.id} chosenPath={chosenPath} bridgeProgress={bridgeProgress} message={message}>
            <div className="quest-prompt"><strong>{copy.prompt}</strong><span>{copy.hint}</span></div>
            <div className="quest-actions">
              {step.responseMode === 'choice' ? step.choices.map((choice) => (
                <button className="interactive-control quest-choice" type="button" key={choice} onClick={() => choose(choice)}>
                  {choice === 'forest' ? <Trees aria-hidden="true" /> : choice === 'river' ? <Waves aria-hidden="true" /> : null}
                  {choice === 'forest' ? 'Forest path' : choice === 'river' ? 'River path' : choice === 'nandri' ? 'Nandri' : 'Hooray'}
                </button>
              )) : responseControls()}
            </div>
            {mode === 'retry' ? <ChildFeedback kind="support" title="Good try" detail="Try once more or use the picture." /> : null}
          </QuestScene>
        )}
      </div>
    </InteractiveSessionShell>
  )
}
