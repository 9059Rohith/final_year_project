import { useReducer, useRef, useState } from 'react'
import { ArrowRight, Check, HandHeart, SkipForward } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CaregiverPromptPanel from '../components/interactive/CaregiverPromptPanel'
import ChildFeedback from '../components/interactive/ChildFeedback'
import InteractiveSessionShell from '../components/interactive/InteractiveSessionShell'
import {
  TALK_TOGETHER_ACTIVITY,
  TALK_TOGETHER_MISSIONS,
  advanceMission,
  buildTalkTogetherReport,
} from '../features/together/talkTogetherActivity'
import { createSession, sessionReducer } from '../features/interactive/sessionEngine'
import { interactiveSessionsAPI } from '../services/api'

export default function TalkTogetherPage() {
  const navigate = useNavigate()
  const [session, dispatch] = useReducer(sessionReducer, TALK_TOGETHER_ACTIVITY, createSession)
  const [missionIndex, setMissionIndex] = useState(0)
  const [mode, setMode] = useState('mission')
  const [assistance, setAssistance] = useState('independent')
  const [events, setEvents] = useState([])
  const startedAtRef = useRef(Date.now())
  const mission = TALK_TOGETHER_MISSIONS[missionIndex]

  const saveCompletion = (finalEvents) => {
    const report = buildTalkTogetherReport({ startedAt: startedAtRef.current, completedAt: Date.now(), events: finalEvents })
    interactiveSessionsAPI.create(report).catch(() => {})
  }

  const confirmTurn = (level = assistance) => {
    const event = { missionId: mission.id, assistance: level }
    const finalEvents = [...events, event]
    setEvents(finalEvents)
    dispatch({ type: 'BEGIN_ATTEMPT', at: Date.now() })
    if (level === 'skipped') dispatch({ type: 'SKIP', at: Date.now() })
    else {
      dispatch({ type: 'RESPONSE_CAPTURED', response: { caregiverConfirmed: true }, at: Date.now() })
      dispatch({ type: 'EVALUATION_SUCCEEDED', assistance: level, at: Date.now() })
    }
    const next = advanceMission({ missionIndex, complete: false })
    if (next.complete) {
      dispatch({ type: 'COMPLETE', at: Date.now() })
      saveCompletion(finalEvents)
      setMode('complete')
    } else setMode('celebrate')
  }

  const nextMission = () => {
    dispatch({ type: 'NEXT_STEP', at: Date.now() })
    setMissionIndex((current) => current + 1)
    setAssistance('independent')
    setMode('mission')
  }

  return (
    <InteractiveSessionShell title="Talk Together" subtitle="Five playful turns with a trusted grown-up" state={session} dispatch={dispatch} steps={TALK_TOGETHER_ACTIVITY.steps}>
      <div className="together-wrap">
        {mode === 'mission' ? (
          <div className="together-card">
            <span className="together-card__number">Mission {missionIndex + 1} of 5</span>
            <div className="together-card__prop" aria-hidden="true">{mission.icon}</div>
            <div className="together-card__copy"><span>{mission.title}</span><h2>{mission.childPrompt}</h2><p>Words, gestures, pictures, and sounds all count as communication.</p></div>
            <CaregiverPromptPanel mission={mission} assistance={assistance} onAssistanceChange={setAssistance} />
            <div className="together-actions">
              <button className="interactive-control together-button together-button--primary" type="button" onClick={() => confirmTurn(assistance)}><Check aria-hidden="true" /> We had a turn</button>
              <button className="interactive-control together-button together-button--quiet" type="button" onClick={() => confirmTurn('skipped')}><SkipForward aria-hidden="true" /> Skip gently</button>
            </div>
          </div>
        ) : null}

        {mode === 'celebrate' ? (
          <div className="together-card together-card--celebrate">
            <div className="together-card__prop" aria-hidden="true"><HandHeart /></div>
            <ChildFeedback kind="success" title={mission.celebrate} detail="A shared turn is worth celebrating." />
            <button className="interactive-control together-button together-button--primary" type="button" onClick={nextMission}>Next mission <ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}

        {mode === 'complete' ? (
          <div className="together-card together-card--complete">
            <div className="together-card__prop" aria-hidden="true">💛</div>
            <ChildFeedback kind="success" title="You talked together!" detail="Five small missions created five meaningful communication opportunities." />
            <button className="interactive-control together-button together-button--primary" type="button" onClick={() => navigate('/play')}>Choose another adventure</button>
          </div>
        ) : null}
      </div>
    </InteractiveSessionShell>
  )
}
