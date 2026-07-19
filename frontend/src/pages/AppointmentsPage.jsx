import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarClock, CalendarCheck, CalendarRange, Stethoscope, Video, MapPin,
  Clock, Plus, X, Star, FileText, Phone, RefreshCw, XCircle,
} from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, SectionTitle, Badge, GradientButton } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const THERAPISTS = [
  { id: 't1', name: 'Dr. Anitha Raman', specialty: 'Articulation & Phonology', rating: 4.9, reviews: 214, color: 'from-primary-500 to-indigo-600' },
  { id: 't2', name: 'Dr. Karthik S.', specialty: 'Oral-Motor Therapy', rating: 4.8, reviews: 167, color: 'from-secondary-500 to-cyan-600' },
  { id: 't3', name: 'Dr. Priya Mohan', specialty: 'Fluency & Breathing', rating: 4.7, reviews: 132, color: 'from-accent-500 to-emerald-600' },
  { id: 't4', name: 'Dr. Suresh Kumar', specialty: 'Language Development', rating: 4.9, reviews: 198, color: 'from-coral-500 to-rose-600' },
]

const INITIAL_UPCOMING = [
  { id: 1, therapist: 'Dr. Anitha Raman', specialty: 'Articulation & Phonology', date: 'Jun 21, 2026', time: '04:30 PM', mode: 'video', color: 'from-primary-500 to-indigo-600' },
  { id: 2, therapist: 'Dr. Karthik S.', specialty: 'Oral-Motor Therapy', date: 'Jun 24, 2026', time: '11:00 AM', mode: 'in-person', color: 'from-secondary-500 to-cyan-600' },
  { id: 3, therapist: 'Dr. Priya Mohan', specialty: 'Fluency & Breathing', date: 'Jun 27, 2026', time: '03:00 PM', mode: 'video', color: 'from-accent-500 to-emerald-600' },
]

const PAST = [
  { id: 'p1', therapist: 'Dr. Anitha Raman', date: 'Jun 14, 2026', time: '04:30 PM', status: 'completed' },
  { id: 'p2', therapist: 'Dr. Karthik S.', date: 'Jun 11, 2026', time: '10:30 AM', status: 'completed' },
  { id: 'p3', therapist: 'Dr. Priya Mohan', date: 'Jun 09, 2026', time: '03:00 PM', status: 'missed' },
  { id: 'p4', therapist: 'Dr. Anitha Raman', date: 'Jun 06, 2026', time: '11:00 AM', status: 'completed' },
  { id: 'p5', therapist: 'Dr. Suresh Kumar', date: 'Jun 02, 2026', time: '02:00 PM', status: 'completed' },
]

function initials(name) {
  return name.split(' ').filter((p) => p[0] && p[0] !== '.').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
}

export default function AppointmentsPage() {
  const { user } = useAuthStore()
  const [upcoming, setUpcoming] = useState(INITIAL_UPCOMING)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ therapist: THERAPISTS[0].name, date: '', time: '', reason: '' })

  const stats = useMemo(() => ({
    upcoming: upcoming.length,
    completed: PAST.filter((p) => p.status === 'completed').length,
    month: upcoming.length + PAST.length,
    therapists: THERAPISTS.length,
  }), [upcoming])

  const cancel = (id) => {
    setUpcoming((list) => list.filter((a) => a.id !== id))
    toast.success('Appointment cancelled')
  }
  const reschedule = (a) => toast.success(`Reschedule request sent for ${a.therapist}`)
  const join = (a) => toast.success(`Joining session with ${a.therapist}…`)

  const submit = (e) => {
    e.preventDefault()
    if (!form.date || !form.time) {
      toast.error('Please pick a date and time')
      return
    }
    const t = THERAPISTS.find((x) => x.name === form.therapist) || THERAPISTS[0]
    const newAppt = {
      id: Date.now(),
      therapist: t.name,
      specialty: t.specialty,
      date: form.date,
      time: form.time,
      mode: 'video',
      color: t.color,
    }
    setUpcoming((list) => [newAppt, ...list])
    setShowModal(false)
    setForm({ therapist: THERAPISTS[0].name, date: '', time: '', reason: '' })
    toast.success('Appointment booked!')
  }

  return (
    <DashboardLayout
      title="Appointments"
      subtitle="Book and manage therapist sessions"
      icon={CalendarClock}
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-primary-600 hover:bg-white/90 transition shadow-md"
        >
          <Plus className="w-4 h-4" /> Book New
        </button>
      }
    >
      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard icon={CalendarClock} title="Upcoming" value={stats.upcoming} color="primary" delay={0} />
          <StatCard icon={CalendarCheck} title="Completed" value={stats.completed} color="accent" delay={0.05} />
          <StatCard icon={CalendarRange} title="This Month" value={stats.month} color="secondary" delay={0.1} />
          <StatCard icon={Stethoscope} title="Therapists" value={stats.therapists} color="gold" delay={0.15} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming */}
          <div className="lg:col-span-2 space-y-5">
            <SectionTitle
              title="Upcoming Sessions"
              subtitle="Your next therapy appointments"
              icon={CalendarClock}
              action={<GradientButton onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Book New Appointment</GradientButton>}
            />

            {upcoming.length === 0 ? (
              <Card className="p-10 text-center">
                <CalendarClock className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">No upcoming appointments. Book one to get started.</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <AnimatePresence>
                  {upcoming.map((a, i) => (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-md transition"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white font-bold shadow-md`}>
                          {initials(a.therapist)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{a.therapist}</h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{a.specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                          <div className="flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 text-primary-500" /> {a.date}</div>
                          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary-500" /> {a.time}</div>
                        </div>
                        <Badge color={a.mode === 'video' ? 'secondary' : 'gold'}>
                          {a.mode === 'video' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {a.mode === 'video' ? 'Video' : 'In-person'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => join(a)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs font-semibold shadow-sm hover:shadow-md transition"
                        >
                          {a.mode === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />} Join
                        </button>
                        <button
                          onClick={() => reschedule(a)}
                          className="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                          title="Reschedule"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => cancel(a.id)}
                          className="p-2 rounded-xl text-coral-500 hover:bg-coral-50 dark:hover:bg-coral-900/30 transition"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Past appointments table */}
            <Card className="p-6 mt-2" delay={0.1}>
              <SectionTitle title="Past Appointments" subtitle="Session history & notes" icon={FileText} />
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                      <th className="py-3 font-bold">Therapist</th>
                      <th className="py-3 font-bold">Date</th>
                      <th className="py-3 font-bold">Time</th>
                      <th className="py-3 font-bold">Status</th>
                      <th className="py-3 font-bold text-right">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PAST.map((p) => (
                      <tr key={p.id} className="border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                        <td className="py-3 font-semibold text-neutral-800 dark:text-neutral-100">{p.therapist}</td>
                        <td className="py-3 text-neutral-500 dark:text-neutral-400">{p.date}</td>
                        <td className="py-3 text-neutral-500 dark:text-neutral-400">{p.time}</td>
                        <td className="py-3">
                          <Badge color={p.status === 'completed' ? 'accent' : 'coral'}>{p.status}</Badge>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => toast.success(`Opening notes for ${p.date}`)}
                            className="text-primary-600 dark:text-primary-400 font-semibold text-xs hover:underline"
                          >
                            View notes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Available therapists */}
          <Card className="p-6 h-fit" delay={0.15}>
            <SectionTitle title="Available Therapists" subtitle="Top-rated specialists" icon={Stethoscope} />
            <div className="space-y-3">
              {THERAPISTS.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 hover:shadow-md transition"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold shadow-md shrink-0`}>
                    {initials(t.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{t.name}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{t.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">{t.rating}</span>
                      <span className="text-[11px] text-neutral-400">({t.reviews})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setForm((f) => ({ ...f, therapist: t.name })); setShowModal(true) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 hover:bg-primary-100 transition shrink-0"
                  >
                    Book
                  </button>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Booking modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 w-full max-w-md pointer-events-auto overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-white">
                    <CalendarClock className="w-6 h-6" />
                    <h3 className="font-bold text-lg">Book Appointment</h3>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={submit} className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Therapist</label>
                    <select
                      value={form.therapist}
                      onChange={(e) => setForm((f) => ({ ...f, therapist: e.target.value }))}
                      className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 border border-transparent focus:border-primary-300 outline-none transition"
                    >
                      {THERAPISTS.map((t) => <option key={t.id} value={t.name}>{t.name} — {t.specialty}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                        className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 border border-transparent focus:border-primary-300 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Time</label>
                      <input
                        type="time"
                        value={form.time}
                        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                        className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 border border-transparent focus:border-primary-300 outline-none transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Reason</label>
                    <textarea
                      rows={3}
                      value={form.reason}
                      onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder="What would you like to focus on?"
                      className="mt-1.5 w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-100 border border-transparent focus:border-primary-300 outline-none transition resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                    >
                      Cancel
                    </button>
                    <GradientButton type="submit" className="flex-1">Confirm Booking</GradientButton>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
