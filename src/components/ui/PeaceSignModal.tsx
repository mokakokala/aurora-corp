import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { HAND_PICK_TABLE } from '../../config/constants'
import { discoverEasterEgg } from '../../lib/discoverEasterEgg'

const COOLDOWN_MS = (41 * 60 + 29) * 1000
const LOCK_KEY = 'aurora_peace_locked_until'

const SIGNS = [
  { emoji: '✌️', id: 'peace', correct: true },
  { emoji: '👊', id: 'fist', correct: false },
  { emoji: '🤘', id: 'rock', correct: false },
  { emoji: '👍', id: 'thumb', correct: false },
  { emoji: '🖐️', id: 'open', correct: false },
]

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function getRemainingMs(): number {
  const lockedUntil = Number(localStorage.getItem(LOCK_KEY) ?? 0)
  return Math.max(0, lockedUntil - Date.now())
}

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

type State = 'idle' | 'success' | 'cooldown'

export function PeaceSignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [signs, setSigns] = useState(() => shuffle(SIGNS))
  const [state, setState] = useState<State>('idle')
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const startCooldownTick = useCallback((initialMs: number) => {
    setRemaining(initialMs)
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      const ms = getRemainingMs()
      setRemaining(ms)
      if (ms <= 0) {
        clearInterval(intervalRef.current)
        setState('idle')
        setSigns(shuffle(SIGNS))
      }
    }, 1000)
  }, [])

  useEffect(() => {
    if (!open) {
      clearInterval(intervalRef.current)
      return
    }
    const ms = getRemainingMs()
    if (ms > 0) {
      setState('cooldown')
      startCooldownTick(ms)
    } else {
      setState('idle')
      setSigns(shuffle(SIGNS))
    }
    return () => clearInterval(intervalRef.current)
  }, [open, startCooldownTick])

  const logPick = useCallback((emoji: string, correct: boolean) => {
    const raw = sessionStorage.getItem('aurora_identity')
    const identity = raw
      ? (JSON.parse(raw) as { prenom_totem: string; ip?: string; city?: string })
      : null
    const base = { prenom_totem: identity?.prenom_totem ?? 'inconnu', ip: identity?.ip ?? null, city: identity?.city ?? null }
    supabase.from(HAND_PICK_TABLE).insert([{ ...base, emoji, correct }])
      .then(({ error }) => { if (error) console.error('hand_pick insert:', error) })
    if (correct) {
      supabase.from('peace_sign_logs').insert([base])
        .then(({ error }) => { if (error) console.error('peace_sign_logs insert:', error) })
    }
  }, [])

  const handlePick = (sign: typeof SIGNS[number]) => {
    if (state !== 'idle') return
    logPick(sign.emoji, sign.correct)
    if (sign.correct) {
      setState('success')
      discoverEasterEgg('peace_sign')
    } else {
      const lockedUntil = Date.now() + COOLDOWN_MS
      localStorage.setItem(LOCK_KEY, String(lockedUntil))
      setState('cooldown')
      startCooldownTick(COOLDOWN_MS)
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/92 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={state === 'success' ? onClose : undefined}
        >
          <motion.div
            className="relative w-full max-w-sm border-2 border-orange-500/70 bg-black font-terminal"
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 16 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
              <div>
                <p className="text-xs text-orange-500 tracking-[0.3em] uppercase">Vérification Biométrique</p>
                <p className="text-sm text-orange-300 font-bold tracking-wider uppercase mt-0.5">
                  Identification Palmaire
                </p>
              </div>
              <button onClick={onClose} className="text-orange-600 hover:text-orange-400 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <AnimatePresence mode="wait">
                {state === 'idle' && (
                  <motion.div
                    key="picking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <p className="text-xs text-orange-400 tracking-widest text-center">
                      Sélectionnez le signe correspondant à la séquence V
                    </p>
                    <div className="grid grid-cols-5 gap-2">
                      {signs.map((sign) => (
                        <button
                          key={sign.id}
                          onClick={() => handlePick(sign)}
                          className="flex items-center justify-center text-3xl py-4 border border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/15 hover:border-orange-400/60 transition-all duration-200"
                        >
                          {sign.emoji}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs tracking-widest text-center text-orange-600">
                      1 tentative — choisissez bien
                    </p>
                  </motion.div>
                )}

                {state === 'cooldown' && (
                  <motion.div
                    key="cooldown"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="border border-red-500/40 bg-red-900/10 p-5 space-y-4 text-center"
                  >
                    <p className="text-xs text-red-500 tracking-[0.3em] uppercase">
                      — Accès refusé —
                    </p>
                    <p className="text-xs text-orange-600 tracking-widest leading-relaxed">
                      Mauvaise séquence détectée. Système verrouillé.
                    </p>
                    <motion.p
                      className="text-3xl text-red-400 font-terminal tracking-widest"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    >
                      {formatTime(remaining)}
                    </motion.p>
                    <p className="text-xs text-orange-700 tracking-widest">
                      avant réactivation du module
                    </p>
                  </motion.div>
                )}

                {state === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="border border-orange-400/60 bg-orange-900/10 p-5 space-y-3 text-center"
                  >
                    <p className="text-xs text-orange-500 tracking-[0.3em] uppercase">
                      — Vérification réussie —
                    </p>
                    <p className="text-sm text-orange-300 font-bold tracking-wider leading-relaxed">
                      Bravo, tu viens de débloquer la date et l'heure de départ.
                    </p>
                    <p className="text-base text-orange-200 font-bold tracking-widest mt-2">
                      RDV le 9 juillet 2026 à 13h30
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
