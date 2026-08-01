export const ASSISTANCE_LEVELS = ['independent', 'verbal_prompt', 'visual_prompt', 'modelled', 'skipped']

export const TALK_TOGETHER_MISSIONS = Object.freeze([
  { id: 'choose-snack', title: 'Picnic Choice', icon: '🍎', caregiverCue: 'Place two familiar pretend snacks in view.', childPrompt: 'Show or tell me which snack you want.', celebrate: 'You made a choice!' },
  { id: 'ask-more', title: 'Bubble Request', icon: '🫧', caregiverCue: 'Pretend to blow bubbles, then pause expectantly.', childPrompt: 'Ask me for more bubbles.', celebrate: 'Your request kept the game going!' },
  { id: 'take-turn', title: 'Ball Turn', icon: '🔵', caregiverCue: 'Roll a soft ball or imaginary ball toward the child.', childPrompt: 'Tell me whose turn comes next.', celebrate: 'You shared a turn!' },
  { id: 'find-treasure', title: 'Treasure Clue', icon: '⭐', caregiverCue: 'Choose one nearby object as the treasure.', childPrompt: 'Give me one clue about the treasure.', celebrate: 'Your clue helped me find it!' },
  { id: 'kind-finish', title: 'Kind Finish', icon: '💛', caregiverCue: 'Offer a wave, high-five, or smile and wait.', childPrompt: 'Choose a kind way to finish our game.', celebrate: 'You finished the game together!' },
])

export const TALK_TOGETHER_ACTIVITY = Object.freeze({
  id: 'talk-together',
  type: 'talk_together',
  maxAttempts: 1,
  steps: TALK_TOGETHER_MISSIONS.map((mission) => ({ id: mission.id, shortLabel: mission.title, responseMode: 'caregiver_confirm', reward: 2 })),
})

export function summarizeAssistance(events) {
  return Object.fromEntries(ASSISTANCE_LEVELS.map((level) => [level, events.filter((event) => event.assistance === level).length]))
}

export function advanceMission(state) {
  if (state.missionIndex >= TALK_TOGETHER_MISSIONS.length - 1) return { missionIndex: state.missionIndex, complete: true }
  return { missionIndex: state.missionIndex + 1, complete: false }
}

export function buildTalkTogetherReport({ startedAt, completedAt, events = [] }) {
  const start = Number(startedAt) || Date.now()
  const end = Math.max(start, Number(completedAt) || start)
  return {
    activity_id: 'talk-together',
    activity_type: 'talk_together',
    started_at: new Date(start).toISOString(),
    completed_at: new Date(end).toISOString(),
    communication_turns: events.length,
    successful_turns: events.filter((event) => event.assistance !== 'skipped').length,
    attempts: events.length,
    assistance_counts: summarizeAssistance(events),
    duration_ms: Math.min(3_600_000, end - start),
    effort_points: events.filter((event) => event.assistance !== 'skipped').length * 2,
  }
}
