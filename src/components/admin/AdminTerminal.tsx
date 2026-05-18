import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Terminal, Loader2, Mail, ShieldCheck } from 'lucide-react'
import { AdminDashboard } from './AdminDashboard'

type AuthStep = 'code1' | 'select' | 'sending' | 'code2' | 'verifying' | 'dashboard'

const FN_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const MASKED_EMAILS = ['mo████@gmail.com', 'ma████@gmail.com']

export function AdminTerminal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<AuthStep>('code1')
  const [code1, setCode1] = useState('')
  const [emailIndex, setEmailIndex] = useState<number | null>(null)
  const [otp, setOtp] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleCode1 = () => {
    if (!code1.trim()) return
    setErrorMsg('')
    setStep('select')
  }

  const handleSelectEmail = async (index: number) => {
    setEmailIndex(index)
    setStep('sending')
    try {
      const res = await fetch(`${FN_BASE}/send-admin-otp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ firstCode: code1, emailIndex: index }),
      })
      const data = await res.json()
      if (data.success) {
        setStep('code2')
      } else {
        setErrorMsg(data.error ?? 'Code invalide')
        setStep('code1')
        setCode1('')
      }
    } catch {
      setErrorMsg('Erreur de connexion au serveur')
      setStep('code1')
    }
  }

  const handleOtp = async () => {
    setErrorMsg('')
    setStep('verifying')
    try {
      const res = await fetch(`${FN_BASE}/verify-admin-otp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      })
      const data = await res.json()
      if (data.valid) {
        setStep('dashboard')
      } else {
        setErrorMsg('Code invalide ou expiré')
        setStep('code2')
        setOtp('')
      }
    } catch {
      setErrorMsg('Erreur de connexion au serveur')
      setStep('code2')
    }
  }

  if (step === 'dashboard') {
    return <AdminDashboard onClose={onClose} />
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/97 backdrop-blur-sm p-4 font-terminal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="pointer-events-none absolute inset-0 scanlines opacity-15" />

      <motion.div
        className="relative w-full max-w-sm border border-orange-500/60 bg-black/95 p-7"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-orange-800 hover:text-orange-400 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-orange-500/30 pb-5">
          <Terminal className="h-4 w-4 text-orange-500" />
          <div>
            <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Accès Restreint</p>
            <h2 className="text-sm tracking-widest text-orange-200 uppercase font-bold mt-0.5">
              Analyse Système
            </h2>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <p className="text-xs tracking-[0.2em] text-orange-500 uppercase">
                &gt; Choisir le destinataire
              </p>
              {MASKED_EMAILS.map((masked, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectEmail(i)}
                  className="w-full border border-orange-500/40 bg-black/60 px-4 py-3 text-sm text-orange-200 tracking-widest hover:border-orange-400 hover:bg-orange-500/10 transition-all text-left flex items-center gap-3"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500/60 flex-shrink-0" />
                  {masked}
                </button>
              ))}
            </motion.div>
          )}

          {step === 'sending' && (
            <motion.div
              key="sending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 justify-center py-8"
            >
              <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
              <span className="text-xs text-orange-500 tracking-widest">Transmission...</span>
            </motion.div>
          )}

          {step === 'code1' && (
            <motion.div
              key="code1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs tracking-[0.2em] text-orange-500 uppercase mb-2">
                  &gt; Code d'accès primaire
                </label>
                <input
                  type="password"
                  value={code1}
                  onChange={e => { setCode1(e.target.value); setErrorMsg('') }}
                  onKeyDown={e => e.key === 'Enter' && code1.length > 0 && handleCode1()}
                  placeholder="——————"
                  autoFocus
                  className="w-full border border-orange-500/40 bg-black px-4 py-3 text-sm text-orange-100 placeholder-orange-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all text-center tracking-[0.4em]"
                />
              </div>
              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-500 tracking-wider"
                >
                  ✗ {errorMsg}
                </motion.p>
              )}
              <button
                onClick={handleCode1}
                disabled={!code1.trim()}
                className="w-full border border-orange-500/60 bg-orange-500/10 px-4 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase hover:bg-orange-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Valider
              </button>
            </motion.div>
          )}

          {(step === 'code2' || step === 'verifying') && (
            <motion.div
              key="code2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs tracking-wider text-orange-600 border border-orange-500/20 bg-orange-500/5 px-3 py-2">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span>Code envoyé à {emailIndex !== null ? MASKED_EMAILS[emailIndex] : '—'}</span>
              </div>
              <div>
                <label className="block text-xs tracking-[0.2em] text-orange-500 uppercase mb-2">
                  &gt; Code de vérification
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrorMsg('') }}
                  onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleOtp()}
                  placeholder="— — — — — —"
                  disabled={step === 'verifying'}
                  autoFocus
                  className="w-full border border-orange-500/40 bg-black px-4 py-3 text-sm text-orange-100 placeholder-orange-800 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all text-center tracking-[0.5em] disabled:opacity-50"
                />
              </div>
              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-500 tracking-wider"
                >
                  ✗ {errorMsg}
                </motion.p>
              )}
              {step === 'verifying' ? (
                <div className="flex items-center gap-2 justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                  <span className="text-xs text-orange-500 tracking-widest">Vérification...</span>
                </div>
              ) : (
                <button
                  onClick={handleOtp}
                  disabled={otp.length !== 6}
                  className="w-full border border-orange-500/60 bg-orange-500/10 px-4 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase hover:bg-orange-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="inline h-3.5 w-3.5 mr-2" />
                  Accéder
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  )
}
