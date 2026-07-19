import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, BookOpenCheck, Target, CalendarCheck, AlertTriangle, Flame,
  Clock, CheckCircle2, Circle, Stethoscope, CalendarClock, CreditCard,
  TrendingUp, Mic, Award, Star,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, SectionTitle, ProgressRing, Badge, GradientButton } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { progressAPI, parentAPI } from '../services/api'

/* ---------------------------------- mock data ---------------------------------- */
const CHILD = {
  name: 'Arjun Kumar',
  age: 6,
  level: 'Level 3 · Intermediate',
  streak: 12,
  initial: 'A',
  stars: 248,
}

const WEEKLY_PROGRESS = [
  { week: 'W1', accuracy: 52, lessons: 4 },
  { week: 'W2', accuracy: 58, lessons: 5 },
  { week: 'W3', accuracy: 61, lessons: 6 },
  { week: 'W4', accuracy: 67, lessons: 7 },
  { week: 'W5', accuracy: 72, lessons: 8 },
  { week: 'W6', accuracy: 78, lessons: 9 },
  { week: 'W7', accuracy: 83, lessons: 11 },
  { week: 'W8', accuracy: 88, lessons: 12 },
]

const LETTER_ACCURACY = [
  { letter: 'அ', acc: 92 },
  { letter: 'ஆ', acc: 88 },
  { letter: 'இ', acc: 74 },
  { letter: 'உ', acc: 81 },
  { letter: 'எ', acc: 63 },
  { letter: 'ஒ', acc: 57 },
  { letter: 'க', acc: 70 },
  { letter: 'ச', acc: 48 },
]

const TIMELINE = [
  { time: 'Today · 9:15 AM', title: 'Letter Learning — அ, ஆ, இ', detail: 'Completed 3 letters · 88% accuracy', color: 'accent', icon: BookOpenCheck },
  { time: 'Today · 8:40 AM', title: 'Speech Analysis Session', detail: 'Recorded 6 words · 2 flagged for review', color: 'primary', icon: Mic },
  { time: 'Yesterday · 5:20 PM', title: 'Candle Breathing Game', detail: 'Earned 15 stars · streak extended', color: 'gold', icon: Star },
  { time: 'Yesterday · 10:00 AM', title: 'Therapist Session w/ Dr. Priya', detail: '30 min · notes added', color: 'coral', icon: Stethoscope },
  { time: '2 days ago · 4:10 PM', title: 'Assessment — Vowel Set', detail: 'Score 76% · improved from 68%', color: 'primary', icon: Award },
]

const WEAK_AREAS = [
  { letter: 'ச', label: 'Cha — sibilant clarity', value: 48 },
  { letter: 'ஒ', label: 'O — rounded vowel', value: 57 },
  { letter: 'எ', label: 'E — front vowel', value: 63 },
  { letter: 'க', label: 'Ka — velar stop', value: 70 },
]

const NOTES = [
  { doctor: 'Dr. Priya Raman', role: 'Speech Therapist', date: 'Jun 17, 2026', text: 'Arjun shows strong improvement in vowel sounds. Continue daily candle-breathing to build airflow control. Reduce screen sessions to 20 min.' },
  { doctor: 'Dr. Priya Raman', role: 'Speech Therapist', date: 'Jun 10, 2026', text: 'Sibilant sounds (ச) still need work. Tongue placement exercises assigned. Great engagement during games.' },
  { doctor: 'Dr. Karthik S', role: 'Pediatric Consultant', date: 'May 28, 2026', text: 'Overall motor-speech coordination improving. Recommend continuing current therapy plan for 6 more weeks.' },
]

const APPOINTMENTS = [
  { date: 'Jun 22', day: 'Mon', title: 'Speech Therapy Session', doctor: 'Dr. Priya Raman', time: '10:00 AM' },
  { date: 'Jun 26', day: 'Fri', title: 'Progress Review', doctor: 'Dr. Karthik S', time: '4:30 PM' },
  { date: 'Jul 03', day: 'Fri', title: 'Tongue Tracking Eval', doctor: 'Dr. Priya Raman', time: '11:15 AM' },
]

const INITIAL_GOALS = [
  { id: 1, text: 'Practice 5 letters daily', done: true },
  { id: 2, text: 'Complete candle game 3× a week', done: true },
  { id: 3, text: 'Master sibilant sound (ச)', done: false },
  { id: 4, text: 'Reach 90% vowel accuracy', done: false },
  { id: 5, text: 'Attend all weekly sessions', done: true },
]

const PAYMENTS = [
  { date: 'Jun 01, 2026', plan: 'Monthly Therapy Plan', amount: '₹2,499', status: 'Paid' },
  { date: 'May 01, 2026', plan: 'Monthly Therapy Plan', amount: '₹2,499', status: 'Paid' },
  { date: 'Apr 01, 2026', plan: 'Assessment + Plan', amount: '₹3,199', status: 'Paid' },
  { date: 'Mar 01, 2026', plan: 'Monthly Therapy Plan', amount: '₹2,499', status: 'Paid' },
]

const BAR_COLORS = ['#22c55e', '#22c55e', '#f59e0b', '#22c55e', '#f43f5e', '#f43f5e', '#f59e0b', '#f43f5e']

// static color maps (JIT-safe — avoids dynamic class names)
const ICON_BG = {
  primary: 'bg-primary-100 dark:bg-primary-900/30',
  secondary: 'bg-secondary-100 dark:bg-secondary-900/30',
  accent: 'bg-accent-100 dark:bg-accent-900/30',
  gold: 'bg-gold-100 dark:bg-gold-900/30',
  coral: 'bg-coral-100 dark:bg-coral-900/30',
}
const ICON_FG = {
  primary: 'text-primary-600 dark:text-primary-400',
  secondary: 'text-secondary-600 dark:text-secondary-400',
  accent: 'text-accent-600 dark:text-accent-400',
  gold: 'text-gold-600 dark:text-gold-400',
  coral: 'text-coral-600 dark:text-coral-400',
}

/* ---------------------------------- tooltip ---------------------------------- */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-bold text-neutral-800 dark:text-neutral-100 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold" style={{ color: p.color || p.fill }}>{p.name}:</span> {p.value}{p.dataKey === 'accuracy' || p.dataKey === 'acc' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export default function ParentDashboard() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState(INITIAL_GOALS)

  const { data: summaryResp } = useQuery({
    queryKey: ['progressSummary', user?.email],
    queryFn: () => progressAPI.getProgressSummary(user?.email),
    enabled: !!user?.email,
  })
  const summary = summaryResp?.data

  const { data: weeklyResp } = useQuery({
    queryKey: ['parentWeekly', user?.email],
    queryFn: () => parentAPI.getWeekly(),
    enabled: !!user?.email,
  })
  const weekly = weeklyResp?.data
  const overall = weekly?.overall
  const hasReal = overall?.has_data

  // Real stats with mock fallbacks
  const lessonsCompleted = summary?.completed_lessons ?? 72
  const avgAccuracy = summary?.avg_accuracy != null ? `${Math.round(summary.avg_accuracy)}%` : '88%'
  const sessionsThisWeek = weekly?.weekly?.sessions_this_week
  const overallAcc = hasReal ? Math.round(overall.overall) : 88

  // Weekly area chart from real history, else summary chart_data, else mock
  const weeklyData = hasReal && overall.history.length
    ? overall.history.map((h) => ({ week: h.label, accuracy: Math.round(h.accuracy ?? 0), lessons: 0 }))
    : Array.isArray(summary?.chart_data) && summary.chart_data.length
      ? summary.chart_data.map((c) => ({ week: c.date, accuracy: Math.round(c.accuracy ?? 0), lessons: 0 }))
      : WEEKLY_PROGRESS

  // Per-sound bar chart from real analysis, else per-lesson progress, else mock
  const letterData = hasReal && overall.by_phoneme.length
    ? overall.by_phoneme.map((p) => ({ letter: p.phoneme, acc: Math.round(p.accuracy ?? 0) }))
    : Array.isArray(summary?.progress_by_lesson) && summary.progress_by_lesson.length
      ? summary.progress_by_lesson.map((l) => ({ letter: `L${l.lesson_id}`, acc: Math.round(l.best_accuracy ?? 0) }))
      : LETTER_ACCURACY

  // Real weak areas: the lowest-scoring sounds, else mock
  const weakAreas = hasReal && overall.by_phoneme.length
    ? [...overall.by_phoneme]
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 4)
        .map((p) => ({ letter: p.phoneme, label: `${p.attempts} attempt${p.attempts === 1 ? '' : 's'}`, value: Math.round(p.accuracy) }))
    : WEAK_AREAS

  const child = { ...CHILD, name: user?.child_name || CHILD.name, stars: summary?.total_stars ?? CHILD.stars }
  const doneCount = goals.filter((g) => g.done).length
  const goalPct = Math.round((doneCount / goals.length) * 100)

  const toggleGoal = (id) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g)))
    const g = goals.find((x) => x.id === id)
    if (g) toast.success(g.done ? 'Goal reopened' : `Goal completed — well done! 🎉`)
  }

  return (
    <DashboardLayout
      title="Parent Dashboard"
      subtitle={`Tracking ${child.name}'s speech-therapy journey`}
      icon={Heart}
    >
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 p-6 sm:p-8 text-white shadow-md mb-6"
      >
        <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-16 w-48 h-48 bg-secondary-400/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white/15 backdrop-blur flex items-center justify-center text-5xl font-bold rotate-3 shadow-lg shrink-0">
            {child.initial}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold">{child.name}</h2>
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-xs font-semibold">{child.age} yrs</span>
            </div>
            <p className="text-white/70 text-sm mt-1">{child.level}</p>
            <div className="flex items-center gap-5 mt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-gold-300" />
                <span className="font-bold">{child.streak}-day streak</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-gold-300 fill-gold-300" />
                <span className="font-bold">{child.stars} stars</span>
              </div>
              <Badge color="gold" className="!bg-white/20 !text-white">On Track</Badge>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center">
            <ProgressRing value={overallAcc} size={110} color="#ffffff" label={`${overallAcc}%`} sublabel="overall" />
          </div>
        </div>
      </motion.div>

      {/* Recommendation (real, from the weakest sound) */}
      {weekly?.recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-primary-200 bg-primary-50/70 dark:bg-primary-900/10 dark:border-primary-800 p-4 mb-6"
        >
          <Target className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <p className="text-sm text-primary-800 dark:text-primary-200">{weekly.recommendation}</p>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BookOpenCheck} title="Lessons Completed" value={String(lessonsCompleted)} sub="+12 this month" color="primary" delay={0.05} />
        <StatCard icon={Target} title="Avg Accuracy" value={avgAccuracy} sub="+5% vs last month" color="accent" delay={0.1} />
        <StatCard icon={CalendarCheck} title="Sessions This Week" value={sessionsThisWeek != null ? String(sessionsThisWeek) : '—'} sub={weekly?.weekly ? `${weekly.weekly.active_days_this_week} active days` : 'This week'} color="secondary" delay={0.15} />
        <StatCard icon={AlertTriangle} title="Weak Areas" value={String(weakAreas.length)} sub="Needs practice" color="coral" delay={0.2} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6" delay={0.1}>
          <SectionTitle title="Weekly Progress" subtitle="Accuracy trend over 8 weeks" icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={weeklyData} margin={{ left: -18, right: 8, top: 6 }}>
              <defs>
                <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="accuracy" name="Accuracy" stroke="#6366f1" strokeWidth={3} fill="url(#accFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6" delay={0.15}>
          <SectionTitle title="Accuracy per Letter" subtitle="Tamil letter mastery levels" icon={Target} />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={letterData} margin={{ left: -18, right: 8, top: 6 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="letter" tick={{ fontSize: 14, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="acc" name="Accuracy" radius={[6, 6, 0, 0]}>
                {letterData.map((d, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length] || (d.acc >= 80 ? '#22c55e' : d.acc >= 65 ? '#f59e0b' : '#f43f5e')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Activity + Weak areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2" delay={0.1}>
          <SectionTitle title="Daily Activity" subtitle="Recent therapy sessions" icon={Clock} />
          <div className="space-y-1">
            {TIMELINE.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex gap-4 group"
              >
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[t.color]}`}>
                    <t.icon className={`w-5 h-5 ${ICON_FG[t.color]}`} />
                  </div>
                  {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800 my-1" />}
                </div>
                <div className="pb-5">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">{t.time}</p>
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100 text-sm mt-0.5">{t.title}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-6" delay={0.15}>
          <SectionTitle title="Weak Areas" subtitle="Sounds needing practice" icon={AlertTriangle} />
          <div className="space-y-5">
            {weakAreas.map((w) => (
              <div key={w.letter}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-coral-50 dark:bg-coral-900/20 text-coral-600 dark:text-coral-400 flex items-center justify-center text-lg font-bold">{w.letter}</span>
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">{w.label}</span>
                  </div>
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{w.value}%</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${w.value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-coral-400 to-gold-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Notes + Goals + Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2" delay={0.1}>
          <SectionTitle title="Doctor's Notes" subtitle="Clinical observations" icon={Stethoscope} />
          <div className="space-y-4">
            {NOTES.map((n, i) => (
              <div key={i} className="rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 bg-neutral-50/60 dark:bg-neutral-800/30">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-xs font-bold">
                      {n.doctor.split(' ')[1]?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{n.doctor}</p>
                      <p className="text-[11px] text-neutral-400">{n.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">{n.date}</span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6" delay={0.15}>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle title="Goals" subtitle={`${doneCount} of ${goals.length} done`} icon={Target} />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${goalPct}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-secondary-500"
                />
              </div>
              <span className="text-sm font-bold text-accent-600 dark:text-accent-400">{goalPct}%</span>
            </div>
            <div className="space-y-2">
              {goals.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className="w-full flex items-center gap-3 text-left p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
                >
                  {g.done
                    ? <CheckCircle2 className="w-5 h-5 text-accent-500 shrink-0" />
                    : <Circle className="w-5 h-5 text-neutral-300 dark:text-neutral-600 shrink-0" />}
                  <span className={`text-sm ${g.done ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-200'}`}>{g.text}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6" delay={0.2}>
            <SectionTitle title="Upcoming" subtitle="Appointments" icon={CalendarClock} />
            <div className="space-y-3">
              {APPOINTMENTS.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:shadow-sm transition">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-primary-500 uppercase">{a.day}</span>
                    <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{a.date.split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">{a.title}</p>
                    <p className="text-xs text-neutral-400">{a.doctor} · {a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Payment history */}
      <Card className="p-6" delay={0.1}>
        <SectionTitle title="Payment History" subtitle="Recent transactions" icon={CreditCard} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                <th className="py-3 font-semibold">Date</th>
                <th className="py-3 font-semibold">Plan</th>
                <th className="py-3 font-semibold">Amount</th>
                <th className="py-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {PAYMENTS.map((p, i) => (
                <tr key={i} className="border-b border-neutral-50 dark:border-neutral-800/60 last:border-0">
                  <td className="py-3 text-neutral-500 dark:text-neutral-400">{p.date}</td>
                  <td className="py-3 font-medium text-neutral-700 dark:text-neutral-200">{p.plan}</td>
                  <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-100">{p.amount}</td>
                  <td className="py-3 text-right"><Badge color="accent">{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end">
          <GradientButton onClick={() => toast.success('Invoice download started')}>
            <CreditCard className="w-4 h-4" /> Download Invoices
          </GradientButton>
        </div>
      </Card>
    </DashboardLayout>
  )
}
