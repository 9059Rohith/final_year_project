import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, Brain, Shield, Star, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const DEMO_EMAIL = 'john.doe@gmail.com'
const RESEND_SECONDS = 30

function maskEmail(email) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  const visible = name.slice(0, 1)
  return `${visible}${'•'.repeat(Math.max(name.length - 1, 3))}@${domain}`
}

const floatingItems = [
  { emoji: '🔢', x: '12%', y: '18%', delay: 0, duration: 6 },
  { emoji: '📱', x: '82%', y: '22%', delay: 1, duration: 7 },
  { emoji: '✅', x: '18%', y: '74%', delay: 2, duration: 5 },
  { emoji: '✨', x: '78%', y: '78%', delay: 0.5, duration: 8 },
  { emoji: '🔐', x: '50%', y: '12%', delay: 1.5, duration: 6 },
]

function SidePanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700">
      <div className="absolute inset-0 bg-grid opacity-10" />

      {floatingItems.map((item, i) => (
        <motion.div
          key={i}
          animate={{ y: [-15, 15, -15] }}
          transition={{ duration: item.duration, repeat: Infinity, ease: 'easeInOut', delay: item.delay }}
          className="absolute text-4xl select-none"
          style={{ left: item.x, top: item.y }}
        >
          {item.emoji}
        </motion.div>
      ))}

      <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 15, repeat: Infinity }}
        className="absolute top-16 left-8 w-64 h-64 bg-secondary-400/30 rounded-full blur-3xl" />
      <motion.div animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 20, repeat: Infinity }}
        className="absolute bottom-16 right-8 w-80 h-80 bg-primary-300/30 rounded-full blur-3xl" />

      <div className="relative z-10 text-center max-w-md">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="w-20 h-20 mx-auto mb-8 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center border border-white/25 shadow-2xl">
            <span className="text-white font-bold text-3xl tracking-tight">SE</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Almost there!</h2>
          <p className="text-lg text-white/70">
            Enter the 6-digit code we sent you to keep every child's therapy journey safe and secure.
          </p>

          <div className="flex justify-center gap-6 mt-10">
            {[
              { icon: Brain, label: 'AI-Powered' },
              { icon: Shield, label: 'Privacy-First' },
              { icon: Star, label: 'Gamified' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white/60 font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const inputsRef = useRef([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1)
    setDigits((prev) => {
      const next = [...prev]
      next[index] = char
      return next
    })
    if (char && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev]
          next[index] = ''
          return next
        })
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus()
        setDigits((prev) => {
          const next = [...prev]
          next[index - 1] = ''
          return next
        })
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputsRef.current[focusIndex]?.focus()
  }

  const verify = () => {
    const code = digits.join('')
    if (code.length < 6) {
      toast.error('Please enter all 6 digits')
      return
    }
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      toast.success('Code verified successfully!')
      setTimeout(() => navigate('/login'), 600)
    }, 1200)
  }

  const resend = () => {
    if (countdown > 0) return
    setDigits(['', '', '', '', '', ''])
    setCountdown(RESEND_SECONDS)
    inputsRef.current[0]?.focus()
    toast.success('A new code is on its way!')
  }

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950">
      <SidePanel />

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30 dark:opacity-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md relative z-10"
        >
          <button
            onClick={() => navigate('/forgot-password')}
            className="inline-flex items-center text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-premium border border-neutral-200/70 dark:border-neutral-800 p-8 sm:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Verify Code</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Enter the 6-digit code</p>
              </div>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
              Code sent to <span className="font-semibold text-neutral-700 dark:text-neutral-200">{maskEmail(DEMO_EMAIL)}</span>
            </p>

            <div className="flex justify-between gap-2 sm:gap-3 mb-8" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputsRef.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={(e) => e.target.select()}
                  className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-2xl border-2 outline-none transition-all
                    text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-800
                    ${digit
                      ? 'border-primary-500 ring-2 ring-primary-500/20'
                      : 'border-neutral-200 dark:border-neutral-700'}
                    focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30`}
                />
              ))}
            </div>

            <button
              onClick={verify}
              disabled={verifying}
              className="btn-primary w-full !py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block" />
                  Verifying...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Verify
                </span>
              )}
            </button>

            <div className="mt-6 text-center text-sm">
              {countdown > 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400">
                  Resend code in <span className="font-semibold text-primary-600 dark:text-primary-400">{countdown}s</span>
                </p>
              ) : (
                <button
                  onClick={resend}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-neutral-400 dark:text-neutral-600 mt-8">
            Wrong email?{' '}
            <button onClick={() => navigate('/login')} className="text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
              Back to Login
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
