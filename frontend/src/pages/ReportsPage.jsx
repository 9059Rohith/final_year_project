import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Printer, Mic, ScanFace, BookOpen, CalendarDays,
  CalendarRange, TrendingUp, Star, Clock, Target, Award,
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, SectionTitle, Badge } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { progressAPI, analysisAPI } from '../services/api'

/* ------------------------------------------------------------------ */
/*  MOCK DATA — one dataset per report tab                             */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'speech', label: 'Speech', icon: Mic, color: 'primary' },
  { id: 'tongue', label: 'Tongue', icon: ScanFace, color: 'secondary' },
  { id: 'letters', label: 'Letter Accuracy', icon: BookOpen, color: 'accent' },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays, color: 'gold' },
  { id: 'monthly', label: 'Monthly', icon: CalendarRange, color: 'coral' },
]

const REPORTS = {
  speech: {
    stats: [
      { icon: Mic, title: 'Avg Pronunciation', value: '87%', sub: '+6% vs last month', color: 'primary' },
      { icon: Target, title: 'Sessions Logged', value: '42', sub: '8 this week', color: 'secondary' },
      { icon: Star, title: 'Stars Earned', value: '318', sub: 'Top 12% of peers', color: 'gold' },
      { icon: Clock, title: 'Practice Time', value: '9h 20m', sub: 'Steady focus', color: 'accent' },
    ],
    chartType: 'radar',
    radar: [
      { skill: 'Vowels', score: 92, target: 85 },
      { skill: 'Consonants', score: 78, target: 80 },
      { skill: 'Clarity', score: 84, target: 75 },
      { skill: 'Rhythm', score: 71, target: 70 },
      { skill: 'Volume', score: 88, target: 80 },
      { skill: 'Tone', score: 80, target: 78 },
    ],
    table: [
      { date: '2026-06-18', lesson: 'அ — Vowel Drill', accuracy: 94, stars: 5, duration: '12 min' },
      { date: '2026-06-16', lesson: 'க — Plosive Sounds', accuracy: 81, stars: 4, duration: '15 min' },
      { date: '2026-06-14', lesson: 'ம — Nasal Practice', accuracy: 88, stars: 4, duration: '10 min' },
      { date: '2026-06-12', lesson: 'ர — Trill Control', accuracy: 73, stars: 3, duration: '18 min' },
      { date: '2026-06-10', lesson: 'ந — Soft Consonants', accuracy: 90, stars: 5, duration: '11 min' },
    ],
  },
  tongue: {
    stats: [
      { icon: ScanFace, title: 'Placement Score', value: '79%', sub: '+4% improvement', color: 'secondary' },
      { icon: Target, title: 'Tracked Sessions', value: '28', sub: '5 this week', color: 'primary' },
      { icon: Award, title: 'Best Streak', value: '11 days', sub: 'Personal record', color: 'gold' },
      { icon: Clock, title: 'Camera Time', value: '5h 45m', sub: 'Calibrated', color: 'accent' },
    ],
    chartType: 'radar',
    radar: [
      { skill: 'Front', score: 84, target: 80 },
      { skill: 'Mid', score: 76, target: 78 },
      { skill: 'Back', score: 69, target: 72 },
      { skill: 'Tip', score: 88, target: 82 },
      { skill: 'Curl', score: 74, target: 70 },
      { skill: 'Hold', score: 81, target: 75 },
    ],
    table: [
      { date: '2026-06-17', lesson: 'Tip Elevation /l/', accuracy: 86, stars: 5, duration: '9 min' },
      { date: '2026-06-15', lesson: 'Back Arch /k/', accuracy: 70, stars: 3, duration: '14 min' },
      { date: '2026-06-13', lesson: 'Mid Blade /sh/', accuracy: 77, stars: 4, duration: '12 min' },
      { date: '2026-06-11', lesson: 'Curl Control /r/', accuracy: 68, stars: 3, duration: '16 min' },
      { date: '2026-06-09', lesson: 'Front Spread /e/', accuracy: 90, stars: 5, duration: '8 min' },
    ],
  },
  letters: {
    stats: [
      { icon: BookOpen, title: 'Letters Mastered', value: '23/31', sub: '74% of alphabet', color: 'accent' },
      { icon: Target, title: 'Avg Accuracy', value: '82%', sub: 'Across all letters', color: 'primary' },
      { icon: Star, title: 'Perfect Letters', value: '14', sub: '90%+ accuracy', color: 'gold' },
      { icon: TrendingUp, title: 'Weakest Area', value: 'ழ ள ண', sub: 'Needs focus', color: 'coral' },
    ],
    chartType: 'bar',
    bar: [
      { letter: 'அ', accuracy: 96 },
      { letter: 'ஆ', accuracy: 91 },
      { letter: 'இ', accuracy: 88 },
      { letter: 'க', accuracy: 84 },
      { letter: 'ச', accuracy: 79 },
      { letter: 'ட', accuracy: 72 },
      { letter: 'ண', accuracy: 61 },
      { letter: 'த', accuracy: 83 },
      { letter: 'ந', accuracy: 90 },
      { letter: 'ப', accuracy: 86 },
      { letter: 'ம', accuracy: 93 },
      { letter: 'ள', accuracy: 58 },
    ],
    table: [
      { date: '2026-06-18', lesson: 'Letter ம Drill', accuracy: 93, stars: 5, duration: '7 min' },
      { date: '2026-06-17', lesson: 'Letter ண Drill', accuracy: 61, stars: 2, duration: '13 min' },
      { date: '2026-06-15', lesson: 'Letter ந Drill', accuracy: 90, stars: 5, duration: '8 min' },
      { date: '2026-06-13', lesson: 'Letter ள Drill', accuracy: 58, stars: 2, duration: '15 min' },
      { date: '2026-06-11', lesson: 'Letter க Drill', accuracy: 84, stars: 4, duration: '9 min' },
    ],
  },
  weekly: {
    stats: [
      { icon: TrendingUp, title: 'Weekly Average', value: '85%', sub: '+9% week-over-week', color: 'gold' },
      { icon: Target, title: 'Sessions', value: '14', sub: 'Goal: 12 ✓', color: 'accent' },
      { icon: Clock, title: 'Time Spent', value: '3h 10m', sub: 'Above target', color: 'primary' },
      { icon: Star, title: 'Stars This Week', value: '64', sub: 'Best week yet', color: 'secondary' },
    ],
    chartType: 'area',
    area: [
      { day: 'Mon', accuracy: 78, minutes: 22 },
      { day: 'Tue', accuracy: 82, minutes: 28 },
      { day: 'Wed', accuracy: 80, minutes: 18 },
      { day: 'Thu', accuracy: 88, minutes: 34 },
      { day: 'Fri', accuracy: 85, minutes: 26 },
      { day: 'Sat', accuracy: 91, minutes: 40 },
      { day: 'Sun', accuracy: 89, minutes: 22 },
    ],
    table: [
      { date: '2026-06-18', lesson: 'Mixed Review', accuracy: 89, stars: 5, duration: '22 min' },
      { date: '2026-06-17', lesson: 'Speech + Tongue', accuracy: 91, stars: 5, duration: '40 min' },
      { date: '2026-06-16', lesson: 'Vowel Sprint', accuracy: 85, stars: 4, duration: '26 min' },
      { date: '2026-06-15', lesson: 'Consonant Set', accuracy: 88, stars: 4, duration: '34 min' },
      { date: '2026-06-14', lesson: 'Letter Recall', accuracy: 80, stars: 4, duration: '18 min' },
    ],
  },
  monthly: {
    stats: [
      { icon: CalendarRange, title: 'Monthly Average', value: '83%', sub: '+11% vs May', color: 'coral' },
      { icon: Target, title: 'Total Sessions', value: '52', sub: 'Across June', color: 'primary' },
      { icon: Clock, title: 'Total Time', value: '13h 40m', sub: 'Consistent', color: 'secondary' },
      { icon: Award, title: 'Badges Earned', value: '6', sub: 'New this month', color: 'gold' },
    ],
    chartType: 'area',
    area: [
      { day: 'Wk 1', accuracy: 74, minutes: 180 },
      { day: 'Wk 2', accuracy: 79, minutes: 205 },
      { day: 'Wk 3', accuracy: 86, minutes: 230 },
      { day: 'Wk 4', accuracy: 90, minutes: 245 },
    ],
    table: [
      { date: '2026-06-15', lesson: 'Week 3 Assessment', accuracy: 86, stars: 5, duration: '45 min' },
      { date: '2026-06-08', lesson: 'Week 2 Assessment', accuracy: 79, stars: 4, duration: '42 min' },
      { date: '2026-06-01', lesson: 'Week 1 Assessment', accuracy: 74, stars: 3, duration: '38 min' },
      { date: '2026-05-25', lesson: 'May Wrap-up', accuracy: 72, stars: 3, duration: '40 min' },
      { date: '2026-05-18', lesson: 'May Mid-month', accuracy: 70, stars: 3, duration: '36 min' },
    ],
  },
}

/* ------------------------------------------------------------------ */
/*  Chart tooltip                                                      */
/* ------------------------------------------------------------------ */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-100 dark:border-neutral-700 px-3 py-2 text-xs">
      <p className="font-bold text-neutral-900 dark:text-white mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-neutral-600 dark:text-neutral-300">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

function StarRow({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < count ? 'text-gold-500 fill-gold-500' : 'text-neutral-300 dark:text-neutral-600'}`} />
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('speech')

  const { data: summaryResp } = useQuery({
    queryKey: ['progressSummary', user?.email],
    queryFn: () => progressAPI.getProgressSummary(user?.email),
    enabled: !!user?.email,
  })
  const summary = summaryResp?.data

  const { data: analysisResp } = useQuery({
    queryKey: ['analysis', user?.email],
    queryFn: () => analysisAPI.getAnalysis('me'),
    enabled: !!user?.email,
  })
  const analysis = analysisResp?.data

  // Build real-data report tabs from the backend summary, falling back to mock.
  const report = useMemo(() => {
    const base = REPORTS[activeTab]
    if (!summary) return base

    const avgAcc = summary.avg_accuracy != null ? Math.round(summary.avg_accuracy) : null
    const completed = summary.completed_lessons
    const byLesson = Array.isArray(summary.progress_by_lesson) ? summary.progress_by_lesson : []
    const chart = Array.isArray(summary.chart_data) ? summary.chart_data : []

    // Real session rows derived from per-lesson progress
    const realTable = byLesson.length
      ? byLesson.slice(0, 6).map((l) => ({
          date: '—',
          lesson: `Lesson ${l.lesson_id}`,
          accuracy: Math.round(l.best_accuracy ?? 0),
          stars: l.stars_best ?? 0,
          duration: `${l.attempts ?? 0} attempt${(l.attempts ?? 0) === 1 ? '' : 's'}`,
        }))
      : base.table

    if (activeTab === 'letters') {
      const realBar = byLesson.length
        ? byLesson.map((l) => ({ letter: `L${l.lesson_id}`, accuracy: Math.round(l.best_accuracy ?? 0) }))
        : base.bar
      return {
        ...base,
        stats: base.stats.map((s) => {
          if (s.title === 'Avg Accuracy' && avgAcc != null) return { ...s, value: `${avgAcc}%` }
          if (s.title === 'Letters Mastered' && completed != null)
            return { ...s, value: `${completed}/${summary.total ?? base.stats[0].value}` }
          return s
        }),
        bar: realBar,
        table: realTable,
      }
    }

    if (activeTab === 'weekly') {
      const realArea = chart.length
        ? chart.map((c) => ({ day: c.date, accuracy: Math.round(c.accuracy ?? 0), minutes: 0 }))
        : base.area
      return {
        ...base,
        stats: base.stats.map((s) => {
          if (s.title === 'Weekly Average' && avgAcc != null) return { ...s, value: `${avgAcc}%` }
          if (s.title === 'Sessions' && completed != null) return { ...s, value: String(completed) }
          return s
        }),
        area: realArea,
        table: realTable,
      }
    }

    if (activeTab === 'speech') {
      // Real per-sound radar from the analysis endpoint, when available.
      const realRadar = analysis?.has_data && analysis.by_phoneme.length
        ? analysis.by_phoneme.slice(0, 6).map((p) => ({
            skill: p.phoneme,
            score: Math.round(p.accuracy),
            target: 80,
          }))
        : base.radar
      const sessionsLogged = analysis?.total_attempts ?? completed
      return {
        ...base,
        stats: base.stats.map((s) => {
          if (s.title === 'Avg Pronunciation' && avgAcc != null) return { ...s, value: `${avgAcc}%` }
          if (s.title === 'Sessions Logged' && sessionsLogged != null) return { ...s, value: String(sessionsLogged) }
          if (s.title === 'Stars Earned' && summary.total_stars != null) return { ...s, value: String(summary.total_stars) }
          return s
        }),
        radar: realRadar,
        table: realTable,
      }
    }

    if (activeTab === 'monthly') {
      const realArea = chart.length
        ? chart.map((c) => ({ day: c.date, accuracy: Math.round(c.accuracy ?? 0), minutes: 0 }))
        : base.area
      return {
        ...base,
        stats: base.stats.map((s) =>
          s.title === 'Monthly Average' && avgAcc != null ? { ...s, value: `${avgAcc}%` } : s
        ),
        area: realArea,
        table: realTable,
      }
    }

    // tongue (no backend data) — keep mock
    return base
  }, [activeTab, summary, analysis])

  const handleDownload = () => {
    toast('Choose “Save as PDF” in the browser print dialog.', { icon: '📄' })
    setTimeout(() => window.print?.(), 100)
  }
  const handlePrint = () => {
    toast('🖨️ Preparing print view…', { icon: '🖨️' })
    setTimeout(() => window.print?.(), 400)
  }

  const headerActions = (
    <>
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-sm font-semibold transition"
      >
        <Download className="w-4 h-4" /> Save as PDF
      </button>
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary-700 hover:bg-white/90 text-sm font-semibold transition shadow-md"
      >
        <Printer className="w-4 h-4" /> Print
      </button>
    </>
  )

  return (
    <DashboardLayout
      title="Reports Center"
      subtitle={`Detailed performance reports for ${user?.child_name || user?.full_name || 'your learner'}`}
      icon={FileText}
      actions={headerActions}
    >
      {/* Segmented tab control */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-2xl shadow-md border border-neutral-100 dark:border-neutral-800 mb-8 w-fit">
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                active
                  ? 'text-white'
                  : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="report-tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <tab.icon className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            {report.stats.map((s, i) => (
              <StatCard key={s.title} {...s} delay={i * 0.05} />
            ))}
          </div>

          {/* Chart */}
          <Card className="p-6 mb-8">
            <SectionTitle
              title={
                report.chartType === 'bar' ? 'Letter Accuracy Breakdown'
                  : report.chartType === 'area' ? 'Performance Trend'
                  : 'Skills Breakdown'
              }
              subtitle="Visual summary of this report period"
              icon={TrendingUp}
              action={<Badge color="primary">Live preview</Badge>}
            />
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {report.chartType === 'bar' ? (
                  <BarChart data={report.bar} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" strokeOpacity={0.4} vertical={false} />
                    <XAxis dataKey="letter" tick={{ fontSize: 14 }} stroke="#a3a3a3" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                    <Bar dataKey="accuracy" name="Accuracy %" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                ) : report.chartType === 'area' ? (
                  <AreaChart data={report.area} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" strokeOpacity={0.4} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#a3a3a3" />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#6366F1" strokeWidth={3} fill="url(#areaGrad)" />
                  </AreaChart>
                ) : (
                  <RadarChart data={report.radar} outerRadius="78%">
                    <PolarGrid stroke="#e5e5e5" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12, fill: '#737373' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#a3a3a3' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Radar name="Target" dataKey="target" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.1} strokeDasharray="4 4" />
                    <Radar name="Score" dataKey="score" stroke="#6366F1" fill="#6366F1" fillOpacity={0.35} strokeWidth={2} />
                  </RadarChart>
                )}
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Session table */}
          <Card className="p-6">
            <SectionTitle title="Session Details" subtitle="Most recent sessions in this report" icon={FileText} />
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-neutral-400 dark:text-neutral-500 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3 font-semibold">Date</th>
                    <th className="py-3 px-3 font-semibold">Lesson</th>
                    <th className="py-3 px-3 font-semibold">Accuracy</th>
                    <th className="py-3 px-3 font-semibold">Stars</th>
                    <th className="py-3 px-3 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {report.table.map((row, i) => (
                    <motion.tr
                      key={`${row.date}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition"
                    >
                      <td className="py-3.5 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{row.date}</td>
                      <td className="py-3.5 px-3 font-semibold text-neutral-800 dark:text-neutral-100">{row.lesson}</td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.accuracy >= 85 ? 'bg-accent-500' : row.accuracy >= 70 ? 'bg-gold-500' : 'bg-coral-500'}`}
                              style={{ width: `${row.accuracy}%` }}
                            />
                          </div>
                          <span className="font-semibold text-neutral-700 dark:text-neutral-200 w-10">{row.accuracy}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3"><StarRow count={row.stars} /></td>
                      <td className="py-3.5 px-3 text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{row.duration}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  )
}
