import { Camera, Gauge, PartyPopper, RotateCcw, Sparkles, Volume2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useInteractionSettingsStore } from '../../store/interactionSettingsStore'
import './interaction.css'

const SELECTS = [
  { key: 'ageBand', label: 'Presentation', icon: Sparkles, options: [['early', 'Ages 4–6'], ['middle', 'Ages 7–9'], ['older', 'Ages 10–12']] },
  { key: 'motionLevel', label: 'Movement', icon: Gauge, options: [['full', 'Full'], ['reduced', 'Reduced'], ['minimal', 'Minimal']] },
  { key: 'celebrationLevel', label: 'Celebrations', icon: PartyPopper, options: [['full', 'Full'], ['gentle', 'Gentle'], ['none', 'None']] },
  { key: 'sessionPace', label: 'Pace', icon: Gauge, options: [['guided', 'Guided'], ['self', 'Self-paced']] },
]

const TOGGLES = [
  { key: 'soundEnabled', label: 'Activity sounds', icon: Volume2 },
  { key: 'spokenPrompts', label: 'Spoken instructions', icon: Volume2 },
  { key: 'cameraEnabled', label: 'Allow camera activities', icon: Camera },
]

export default function SensorySettingsPanel({ onDone }) {
  const childAge = useAuthStore((state) => state.user?.child_age)
  const { preferences, updatePreference, resetPreferences } = useInteractionSettingsStore()

  return (
    <section className="interactive-settings" aria-labelledby="interaction-settings-title">
      <div className="interactive-settings__heading">
        <div>
          <h2 id="interaction-settings-title">Make practice feel comfortable</h2>
          <p>A caregiver can change these choices at any time.</p>
        </div>
        <button className="interactive-control interactive-settings__reset" type="button" onClick={() => resetPreferences({ age: childAge })}>
          <RotateCcw aria-hidden="true" /> Reset
        </button>
      </div>

      <div className="interactive-settings__grid">
        {SELECTS.map(({ key, label, icon: Icon, options }) => (
          <label key={key} className="interactive-settings__field">
            <span><Icon aria-hidden="true" /> {label}</span>
            <select value={preferences[key]} onChange={(event) => updatePreference(key, event.target.value)}>
              {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>
        ))}
      </div>

      <div className="interactive-settings__toggles">
        {TOGGLES.map(({ key, label, icon: Icon }) => (
          <label key={key} className="interactive-settings__toggle">
            <Icon aria-hidden="true" />
            <span>{label}</span>
            <input
              type="checkbox"
              checked={preferences[key]}
              onChange={(event) => updatePreference(key, event.target.checked)}
            />
          </label>
        ))}
      </div>

      {onDone ? <button type="button" className="interactive-control interactive-primary-button" onClick={onDone}>Save choices</button> : null}
    </section>
  )
}
