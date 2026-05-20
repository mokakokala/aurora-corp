import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CONNECTION_LOG_TABLE } from '../../config/constants'

type Mode = 'register' | 'login'
type Step = 'form' | 'loading' | 'confirmed'

interface Props {
  onSuccess: () => void
}

function usernameToEmail(username: string): string {
  return `${username
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')}@aurora.camp`
}

export function IdentificationPortal({ onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>('register')
  const [step, setStep] = useState<Step>('form')
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setStep('form')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Le mot de passe doit faire au moins 6 caractères.')
        return
      }
      if (password !== confirm) {
        setError('Les mots de passe ne correspondent pas.')
        return
      }
    }

    setStep('loading')

    const geo = await fetch('https://ipinfo.io/json').then(r => r.json()).catch(() => ({}))
    const ip: string | null = geo.ip ?? null
    const city: string | null = geo.city ? `${geo.city}, ${geo.country}` : null
    const email = usernameToEmail(username)

    if (mode === 'register') {
      const { data, error: signUpErr } = await supabase.auth.signUp({ email, password })
      if (signUpErr || !data.user) {
        const msg = signUpErr?.message ?? ''
        setError(msg.includes('already') ? 'Ce pseudo est déjà pris.' : 'Erreur lors de la création du compte.')
        setStep('form')
        return
      }
      const { error: insertErr } = await supabase.from('users').insert([{
        auth_id: data.user.id,
        username: username.trim(),
        age: parseInt(age, 10),
        ip,
        city,
      }])
      if (insertErr) {
        setError('Ce pseudo est déjà pris.')
        setStep('form')
        return
      }
      sessionStorage.setItem('aurora_identity', JSON.stringify({
        prenom_totem: username.trim(), age: parseInt(age, 10), ip, city,
      }))
    } else {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr || !data.user) {
        setError('Pseudo ou mot de passe incorrect.')
        setStep('form')
        return
      }
      const { data: userData } = await supabase
        .from('users').select('username, age, ip, city')
        .eq('auth_id', data.user.id).single()
      const resolvedUsername = userData?.username ?? username.trim()
      sessionStorage.setItem('aurora_identity', JSON.stringify({
        prenom_totem: resolvedUsername,
        age: userData?.age ?? 0,
        ip: userData?.ip ?? ip,
        city: userData?.city ?? city,
      }))
      supabase.from(CONNECTION_LOG_TABLE).insert([{
        username: resolvedUsername,
        ip: userData?.ip ?? ip,
        city: userData?.city ?? city,
      }]).then(({ error }) => { if (error) console.error('connection_log insert:', error) })
    }

    setStep('confirmed')
    setTimeout(onSuccess, 2200)
  }

  const isRegister = mode === 'register'
  const canSubmit = username.trim() && password && (!isRegister || (age && confirm))

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/97 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />

      <motion.div
        className="w-full max-w-md border border-orange-500/60 bg-black/90 p-8 font-terminal"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-orange-500/40 pb-5">
          <Shield className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Terminal A.U.R.O.R.A</p>
            <h1 className="mt-1 text-sm tracking-widest text-orange-100 uppercase font-bold">
              Identification Requise
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
            <span className="text-xs text-orange-400 tracking-widest">EN LIGNE</span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex mb-6 border border-orange-500/30">
          {(['register', 'login'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-200 ${
                mode === m
                  ? 'bg-orange-500/20 text-orange-300 border-b-2 border-orange-500'
                  : 'text-orange-600 hover:text-orange-400'
              }`}
            >
              {m === 'register' ? 'Nouveau joueur' : 'Déjà inscrit'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.form
              key={`form-${mode}`}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                  &gt; Pseudo / Totem
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="Ton pseudo ou totem"
                  className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                    &gt; Âge
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    required
                    min={8}
                    max={99}
                    placeholder="Âge"
                    className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                  &gt; Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={isRegister ? 'Minimum 6 caractères' : 'Mot de passe'}
                  className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                    &gt; Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Répète ton mot de passe"
                    className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
                  />
                </div>
              )}

              {error && (
                <p className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isRegister ? 'Créer mon compte' : 'Accéder au terminal'}
              </button>

              {mode === 'login' && (
                <p className="text-center text-xs text-orange-800 tracking-widest leading-relaxed">
                  Mot de passe oublié ?{' '}
                  <a
                    href="https://wa.me/32494712844"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-400 transition-colors"
                  >
                    WhatsApp QG
                  </a>
                  <br />
                  <span className="text-orange-700">+32 494 71 28 44</span>
                </p>
              )}
              <p className="text-center text-xs text-orange-700 tracking-widest">
                PROTOCOLE DE SÉCURITÉ NIVEAU 4 — DONNÉES CHIFFRÉES
              </p>
            </motion.form>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <p className="text-xs tracking-[0.3em] text-orange-400 uppercase">
                {isRegister ? 'Création du compte...' : 'Authentification...'}
              </p>
            </motion.div>
          )}

          {step === 'confirmed' && (
            <motion.div
              key="confirmed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center gap-4 py-8 text-center"
            >
              <Shield className="h-10 w-10 text-orange-500" />
              <p className="text-sm tracking-widest text-orange-300 uppercase leading-relaxed">
                Identité confirmée.
                <br />
                Bienvenue sur le réseau A.U.R.O.R.A.
              </p>
              <p className="text-xs text-orange-600 tracking-widest">
                Chargement du terminal...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
