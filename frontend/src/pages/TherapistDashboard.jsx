import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Users, TrendingUp, AlertTriangle, Activity,
  UserPlus, ChevronRight, X, Star, Target,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout'
import { Card, StatCard, SectionTitle, Badge, GradientButton } from '../components/ui'
import { useAuthStore } from '../store/authStore'
import { therapistAPI } from '../services/api'

const AVATAR_BG = [
  'from-primary-500 to-indigo-600',
  'from-accent-500 to-emerald-600',
  'from-secondary-500 to-cyan-600',
  'from-gold-400 to-amber-500',
  'from-coral-500 to-rose-600',
]

function statusFor(acc) {
  if (acc >= 85) return { label: 'Excelling', color: 'gold' }
  if (acc >= 70) return { label: 'On Track', color: 'accent' }
  if (acc >= 50) return { label: 'Improving', color: 'primary' }
  return { label: 'Needs Attention', color: 'coral' }
}

function fmtDate(iso) {
  if (!iso) return 'No sessions yet'
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

export default function TherapistDashboard() {
  const { user } = useAuthStore()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [assignEmail, setAssignEmail] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    therapistAPI
      .getChildren()
      .then((res) => {
        setChildren(res.data.children || [])
        setForbidden(false)
      })
      .catch((err) => {
        if (err.response?.status === 403) setForbidden(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const assign = async (e) => {
    e.preventDefault()
    if (!assignEmail) return
    setAssigning(true)
    try {
      const res = await therapistAPI.assignChild(assignEmail)
      toast.success(res.data.message || 'Child assigned')
      setAssignEmail('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Could not assign child')
    } finally {
      setAssigning(false)
    }
  }

  const openDetail = async (child) => {
    setDetail({ child, analysis: null })
    setDetailLoading(true)
    try {
      const res = await therapistAPI.getChild(child.id)
      setDetail(res.data)
    } catch {
      toast.error('Could not load child details')
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  // Caseload aggregates (real)
  const count = children.length
  const avgAccuracy = count
    ? Math.round(children.reduce((s, c) => s + (c.avg_accuracy || 0), 0) / count)
    : 0
  const needsAttention = children.filter((c) => (c.avg_accuracy || 0) < 50).length
  const totalSessions = children.reduce((s, c) => s + (c.total_sessions || 0), 0)

  if (forbidden) {
    return (
      <DashboardLayout title="Therapist Workspace" subtitle="Clinical caseload" icon={Stethoscope}>
        <Card className="p-10 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <Stethoscope className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="font-bold text-lg text-neutral-900 dark:text-white mb-1">Therapist account required</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            This workspace is for speech therapists. Ask an administrator to enable a therapist
            account, or register one via the therapist sign-up.
          </p>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Therapist Workspace"
      subtitle={`Welcome back, ${user?.full_name || 'Therapist'} — your caseload at a glance`}
      icon={Stethoscope}
    >
      {/* Real stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} title="Active Children" value={String(count)} sub="Assigned to you" color="primary" delay={0.05} />
        <StatCard icon={TrendingUp} title="Caseload Avg" value={`${avgAccuracy}%`} sub="Mean accuracy" color="accent" delay={0.1} />
        <StatCard icon={AlertTriangle} title="Needs Attention" value={String(needsAttention)} sub="Below 50%" color="coral" delay={0.15} />
        <StatCard icon={Activity} title="Total Sessions" value={String(totalSessions)} sub="Across caseload" color="secondary" delay={0.2} />
      </div>

      {/* Assign a child */}
      <Card className="p-6 mb-6">
        <SectionTitle title="Assign a Child" subtitle="Link an existing child account by email" icon={UserPlus} />
        <form onSubmit={assign} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={assignEmail}
            onChange={(e) => setAssignEmail(e.target.value)}
            placeholder="child-parent@email.com"
            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-primary-300 focus:bg-white dark:focus:bg-neutral-900 outline-none transition text-neutral-700 dark:text-neutral-200"
          />
          <GradientButton type="submit" disabled={assigning}>
            <UserPlus className="w-4 h-4" /> {assigning ? 'Assigning…' : 'Assign'}
          </GradientButton>
        </form>
      </Card>

      {/* Caseload */}
      <Card className="p-6">
        <SectionTitle title="My Children" subtitle="Sorted by who needs the most support" icon={Users} />
        {loading ? (
          <div className="py-10 text-center text-neutral-400">Loading caseload…</div>
        ) : count === 0 ? (
          <div className="py-10 text-center text-neutral-400">
            No children assigned yet. Use the form above to add one by email.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((c, i) => {
              const st = statusFor(c.avg_accuracy || 0)
              const name = c.child_name || c.full_name || c.email
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 hover:shadow-lg transition-all bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_BG[i % AVATAR_BG.length]} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                      {(name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-800 dark:text-neutral-100 truncate">{name}</p>
                      <p className="text-xs text-neutral-400">
                        {c.child_age ? `${c.child_age} yrs · ` : ''}last: {fmtDate(c.last_active)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge color={st.color}>{st.label}</Badge>
                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-200">{Math.round(c.avg_accuracy || 0)}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.avg_accuracy || 0}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mb-3">
                    <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 text-gold-500" /> {c.total_stars}</span>
                    <span className="inline-flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {c.total_sessions} sessions</span>
                    {c.weakest && (
                      <span className="inline-flex items-center gap-1 text-coral-500">
                        <Target className="w-3.5 h-3.5" /> {c.weakest.phoneme}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openDetail(c)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition"
                  >
                    View Details <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Child detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDetail(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white dark:bg-neutral-900 rounded-3xl shadow-premium-lg border border-neutral-100 dark:border-neutral-800 max-w-lg w-full p-7 max-h-[85vh] overflow-y-auto"
            >
              <button
                onClick={() => setDetail(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">
                {detail.child.child_name || detail.child.full_name || detail.child.email}
              </h3>
              <p className="text-sm text-neutral-400 mb-5">
                {detail.child.child_age ? `${detail.child.child_age} yrs · ` : ''}
                {detail.child.total_sessions} sessions · {detail.child.total_stars} stars
              </p>

              {detailLoading || !detail.analysis ? (
                <div className="py-8 text-center text-neutral-400">Loading analytics…</div>
              ) : !detail.analysis.has_data ? (
                <div className="py-8 text-center text-neutral-400">No sessions recorded yet.</div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Accuracy', detail.analysis.metrics.accuracy],
                      ['Clarity (GOP)', detail.analysis.metrics.clarity],
                      ['Sound Match', detail.analysis.metrics.sound_match],
                      ['Airflow', detail.analysis.metrics.airflow],
                    ].map(([label, val]) => (
                      <div key={label} className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 p-3">
                        <p className="text-xs text-neutral-400">{label}</p>
                        <p className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{Math.round(val)}%</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400 mb-2">Per-sound accuracy</p>
                    <div className="space-y-2">
                      {detail.analysis.by_phoneme.map((p) => {
                        const st = statusFor(p.accuracy)
                        return (
                          <div key={p.phoneme} className="flex items-center gap-3">
                            <span className="w-16 font-bold text-sm text-primary-600 dark:text-primary-400">{p.phoneme}</span>
                            <div className="flex-1 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${
                                st.color === 'accent' ? 'from-accent-500 to-emerald-500'
                                  : st.color === 'gold' ? 'from-gold-400 to-amber-500'
                                  : st.color === 'primary' ? 'from-primary-500 to-indigo-500'
                                  : 'from-coral-500 to-rose-500'
                              }`} style={{ width: `${p.accuracy}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 w-16 text-right">
                              {Math.round(p.accuracy)}% · {p.attempts}×
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {detail.analysis.weakest && (
                    <div className="rounded-2xl border border-coral-200 bg-coral-50/60 dark:bg-coral-900/10 p-4">
                      <p className="text-sm text-coral-700 dark:text-coral-300">
                        <strong>Focus area:</strong> &quot;{detail.analysis.weakest.phoneme}&quot; at{' '}
                        {Math.round(detail.analysis.weakest.accuracy)}% — assign extra practice here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
