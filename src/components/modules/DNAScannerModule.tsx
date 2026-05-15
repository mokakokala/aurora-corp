import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dna, Search, RotateCcw } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'
import { TARGET_DATE } from '../../config/constants'

type Step = 'idle' | 'scanning' | 'result'

const SCAN_DURATION = 2600

export function DNAScannerModule() {
  const [step, setStep] = useState<Step>('idle')
  const [input, setInput] = useState('')
  const [submittedId, setSubmittedId] = useState('')
  const { days, hours, minutes, seconds, expired } = useCountdown(TARGET_DATE)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setSubmittedId(input.trim())
    setStep('scanning')
    timeoutRef.current = setTimeout(() => setStep('result'), SCAN_DURATION)
  }

  const reset = () => {
    setStep('idle')
    setInput('')
    setSubmittedId('')
  }

  const isAndalouse = /andalouse|pauwels/i.test(submittedId)

  const countdownStr = expired
    ? 'RESTAURATION COMPLÈTE'
    : `${String(days).padStart(2, '0')}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/30 pb-4">
        <Dna className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Module Gamma</p>
          <h2 className="mt-0.5 text-sm tracking-widest text-orange-200 uppercase font-bold">
            Scanner ADN — Identification
          </h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.form
            key="idle"
            onSubmit={handleScan}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                &gt; Identifiant biométrique
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Totem ou prénom..."
                className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-600 font-terminal outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex w-full items-center justify-center gap-3 border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Search className="h-3.5 w-3.5" />
              Lancer l'analyse
            </button>
          </motion.form>
        )}

        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-6"
          >
            {/* Animated scan bar */}
            <div className="w-full h-0.5 bg-orange-900/50 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: SCAN_DURATION / 1000, ease: 'linear' }}
              />
            </div>

            <div className="font-terminal text-xs text-orange-400 tracking-widest space-y-1 text-center">
              <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                &gt; Analyse en cours...
              </motion.p>
              <p className="text-orange-500">Séquençage ADN : {submittedId.toUpperCase()}</p>
            </div>

            {/* DNA helix dots */}
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-orange-500"
                  animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5"
          >
            {/* Result block */}
            <div className={`border p-5 font-terminal space-y-3 ${isAndalouse ? 'border-yellow-500/60 bg-yellow-900/10' : 'border-red-500/40 bg-red-900/10'}`}>
              <p className="text-xs text-orange-500 tracking-widest">
                &gt; SÉQUENCE : {submittedId.toUpperCase()}
              </p>
              {isAndalouse ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-yellow-400 tracking-wider font-bold leading-relaxed">
                    ⚠ ALERTE LOGISTIQUE
                  </p>
                  <p className="text-xs text-orange-200 leading-relaxed">
                    Seau de 50L de sauce andalouse Pauwels sacrée intact localisé dans la section 4 de la soute. La suprématie du goût est préservée, le moral des troupes est sauvé.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    [DONNÉES CORROMPUES DUES À UNE VIOLATION DE L'ARTICLE 4 DE SÉCURITÉ]
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              )}
            </div>

            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 border border-orange-500/50 bg-black/40 px-6 py-3 text-xs tracking-[0.3em] text-orange-500 uppercase transition-all duration-300 hover:text-orange-300 hover:border-orange-500"
            >
              <RotateCcw className="h-3 w-3" />
              Nouvelle analyse
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
