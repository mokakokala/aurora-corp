import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, AlertTriangle, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SUPABASE_TABLE } from '../../config/constants'

type Step = 'form' | 'loading' | 'confirmed'

interface Props {
  onSuccess: () => void
}

export function IdentificationPortal({ onSuccess }: Props) {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !age) return
    setError('')
    setStep('loading')

    const { error } = await supabase.from(SUPABASE_TABLE).insert([
      {
        prenom_totem: name.trim(),
        age: parseInt(age, 10),
        created_at: new Date().toISOString(),
      },
    ])
    if (error) console.error('Supabase insert error:', error)

    sessionStorage.setItem('aurora_identity', JSON.stringify({ prenom_totem: name.trim(), age: parseInt(age, 10) }))
    setStep('confirmed')
    setTimeout(onSuccess, 2200)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/97 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />

      <motion.div
        className="w-full max-w-md border border-orange-500/60 bg-black/90 p-8 font-terminal"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="mb-8 flex items-center gap-3 border-b border-orange-500/40 pb-6">
          <Shield className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">
              Terminal A.U.R.O.R.A
            </p>
            <h1 className="mt-1 text-sm tracking-widest text-orange-100 uppercase font-bold">
              Identification Requise
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
            <span className="text-xs text-orange-400 tracking-widest">EN LIGNE</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                  &gt; Prénom / Totem
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Prénom / Totem"
                  className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-600 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                  &gt; Âge
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min={8}
                  max={99}
                  placeholder="Âge"
                  className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-600 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
                />
              </div>

              {error && (
                <p className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="h-3 w-3" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!name.trim() || !age}
                className="w-full border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Lancer l'identification
              </button>

              <p className="text-center text-xs text-orange-600 tracking-widest">
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
                Analyse biométrique en cours...
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
                Biométrie confirmée.
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
