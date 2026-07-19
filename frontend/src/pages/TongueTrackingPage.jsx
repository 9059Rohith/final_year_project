import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScanFace, Camera, Square, RotateCcw, Eye, Smile, Target,
  AlignCenter, Sparkles, Info, CircleDot, Activity,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, SectionTitle, Badge, GradientButton } from '../components/ui'
import { useAuthStore } from '../store/authStore'

/* ---------------- MOCK DATA ---------------- */
// Face mesh landmark dots (normalized 0-100 coords)
const LANDMARKS = [
  [50, 18], [40, 22], [60, 22], [32, 30], [68, 30], [28, 42], [72, 42],
  [38, 38], [62, 38], [44, 40], [56, 40], [30, 56], [70, 56], [40, 60],
  [60, 60], [50, 50], [44, 52], [56, 52], [50, 66], [42, 70], [58, 70],
  [50, 72], [46, 74], [54, 74], [50, 78], [36, 64], [64, 64], [50, 84],
]

const LIVE_LABELS = [
  { label: 'Mouth Open', value: '72%', x: '8%', y: '20%', color: 'secondary' },
  { label: 'Tongue Position', value: 'Center', x: '62%', y: '34%', color: 'accent' },
  { label: 'Jaw Drop', value: '18°', x: '10%', y: '64%', color: 'gold' },
  { label: 'Lip Symmetry', value: '94%', x: '60%', y: '70%', color: 'primary' },
]

const STATS = [
  { icon: Target, title: 'Tongue Accuracy', value: '86%', sub: '+6% today', color: 'primary' },
  { icon: Smile, title: 'Mouth Opening', value: '72%', sub: 'Optimal range', color: 'secondary' },
  { icon: AlignCenter, title: 'Symmetry', value: '94%', sub: 'Excellent', color: 'accent' },
  { icon: Eye, title: 'Eye Contact', value: '68%', sub: 'Improving', color: 'gold' },
]

const LEGEND = [
  { color: 'bg-secondary-500', label: 'Mouth landmarks' },
  { color: 'bg-accent-500', label: 'Tongue tracking' },
  { color: 'bg-gold-400', label: 'Jaw / chin' },
  { color: 'bg-primary-500', label: 'Lip contour' },
]

// Heatmap intensity grid (12 x 6)
const HEAT = Array.from({ length: 72 }, (_, i) => {
  const r = Math.floor(i / 12)
  const c = i % 12
  const center = Math.exp(-((c - 6) ** 2 + (r - 3) ** 2) / 9)
  return Math.min(1, center + ((i * 13) % 30) / 100)
})

export default function TongueTrackingPage() {
  const { user } = useAuthStore()
  const [active, setActive] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [hasRecorded, setHasRecorded] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (active) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [active])

  const start = () => {
    setActive(true)
    setSeconds(0)
    toast('Camera started — face the screen', { icon: '📷' })
  }
  const stop = () => {
    setActive(false)
    setHasRecorded(true)
    toast.success('Tracking session saved')
  }
  const replay = () => {
    if (!hasRecorded) return toast.error('Record a session first')
    toast('Replaying last session…', { icon: '⏯️' })
  }
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <DashboardLayout
      title="Tongue & Mouth Tracking"
      subtitle={`Movement evaluation for ${user?.child_name || user?.full_name || 'your child'}`}
      icon={ScanFace}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera preview */}
          <Card className="lg:col-span-2 p-6">
            <SectionTitle
              title="Live Camera"
              subtitle="MediaPipe face-mesh tracking"
              icon={Camera}
              action={
                <Badge color={active ? 'coral' : 'neutral'}>
                  <CircleDot className={`w-3 h-3 ${active ? 'text-coral-500 animate-pulse' : ''}`} />
                  {active ? 'LIVE' : 'Offline'}
                </Badge>
              }
            />
            <div className="relative aspect-video rounded-2xl bg-neutral-900 overflow-hidden border border-neutral-800">
              {/* subtle grid backdrop */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />

              {/* SVG face mesh */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {active &&
                  LANDMARKS.map(([x, y], i) => (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={0.7}
                      className="fill-secondary-400"
                      animate={{ opacity: [0.4, 1, 0.4], r: [0.6, 0.9, 0.6] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: (i % 8) * 0.12 }}
                    />
                  ))}
                {active &&
                  LANDMARKS.slice(0, -1).map(([x, y], i) => {
                    const [nx, ny] = LANDMARKS[i + 1]
                    return (
                      <motion.line
                        key={`l-${i}`}
                        x1={x} y1={y} x2={nx} y2={ny}
                        className="stroke-primary-400/30"
                        strokeWidth={0.25}
                        animate={{ opacity: [0.1, 0.5, 0.1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
                      />
                    )
                  })}
                {active && (
                  <motion.ellipse
                    cx={50} cy={72} rx={9} ry={4}
                    className="fill-accent-500/20 stroke-accent-400"
                    strokeWidth={0.4}
                    animate={{ ry: [3, 5, 3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
              </svg>

              {/* Scanning line */}
              {active && (
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-secondary-400 to-transparent"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              )}

              {/* Live overlay labels */}
              <AnimatePresence>
                {active &&
                  LIVE_LABELS.map((l, i) => (
                    <motion.div
                      key={l.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="absolute px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-[11px] font-semibold text-white border border-white/10"
                      style={{ left: l.x, top: l.y }}
                    >
                      <span className="text-neutral-300">{l.label}: </span>
                      <span className="text-secondary-300">{l.value}</span>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {/* Idle placeholder */}
              {!active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-neutral-400">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium">Camera is off</p>
                  <p className="text-xs text-neutral-500">Press Start Camera to begin tracking</p>
                </div>
              )}

              {/* Timer badge */}
              {active && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-coral-500/90 text-white text-xs font-mono font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> REC {fmt(seconds)}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {!active ? (
                <GradientButton onClick={start}>
                  <Camera className="w-4 h-4" /> Start Camera
                </GradientButton>
              ) : (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-semibold text-sm shadow-md transition"
                >
                  <Square className="w-4 h-4 fill-white" /> Stop
                </button>
              )}
              <button
                onClick={replay}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
              >
                <RotateCcw className="w-4 h-4" /> Replay
              </button>
            </div>
          </Card>

          {/* Instruction card */}
          <Card className="p-6 flex flex-col">
            <SectionTitle title="Exercise" icon={Info} />
            <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 p-6 text-white mb-4">
              <Sparkles className="w-7 h-7 mb-3" />
              <h3 className="text-lg font-bold mb-1">Stick your tongue out and hold</h3>
              <p className="text-sm text-white/80">Keep it centered and steady for 5 seconds while the camera tracks your movement.</p>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                'Sit facing the light',
                'Open your mouth wide',
                'Extend your tongue straight',
                'Hold steady — breathe normally',
              ].map((step, i) => (
                <li key={i} className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300">
                  <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Metrics grid */}
        <div>
          <SectionTitle title="Session Metrics" subtitle="Tracked in real time" icon={Target} />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <StatCard key={s.title} {...s} delay={i * 0.1} />
            ))}
          </div>
        </div>

        {/* Heatmap + legend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <SectionTitle title="Frame Analysis Heatmap" subtitle="Movement intensity per region" icon={Activity} />
            <div className="grid grid-cols-12 gap-1.5">
              {HEAT.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.006 }}
                  whileHover={{ scale: 1.2 }}
                  className="aspect-square rounded-md"
                  style={{
                    background: `linear-gradient(135deg, rgba(99,102,241,${v}), rgba(6,182,212,${v}))`,
                  }}
                  title={`Intensity ${Math.round(v * 100)}%`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 text-xs text-neutral-400">
              <span>Low activity</span>
              <div className="flex-1 mx-3 h-2 rounded-full bg-gradient-to-r from-primary-500/20 via-primary-500/60 to-secondary-500" />
              <span>High activity</span>
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle title="Landmark Legend" icon={ScanFace} />
            <ul className="space-y-3">
              {LEGEND.map((l) => (
                <li key={l.label} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <span className={`w-3.5 h-3.5 rounded-full ${l.color}`} />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{l.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-accent-50 dark:bg-accent-900/20 text-xs text-accent-700 dark:text-accent-300">
              468 face landmarks tracked at 30 FPS for precise tongue and lip movement detection.
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
