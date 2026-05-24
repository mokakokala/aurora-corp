import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'

type Phase = 'tension' | 'reveal' | 'invisible'

// ── Timing (ms) — calé sur la musique de 29s ──────────────────────────────
const T_TREMOR_1  =  3000  // début tremblement léger
const T_TREMOR_2  =  9000  // tremblement moyen
const T_TREMOR_3  = 16000  // tremblement intense
const T_REVEAL    = 20500  // le cri "AURORA"
const T_QUAKE_END = 22300  // fin du séisme
const T_INVISIBLE = 25000  // overlay entièrement effacé
const T_DONE      = 30000  // musique terminée

interface Props {
  onReveal: () => void  // appelé à 21s — site passe en vert, bouton clignote
  onDone: () => void    // appelé à 57s — composant démonté
  baseUrl: string
}

export function CountdownEndSequence({ onReveal, onDone, baseUrl }: Props) {
  const [phase, setPhase]       = useState<Phase>('tension')
  const [tremor, setTremor]     = useState<0 | 1 | 2 | 3>(0)
  const [quaking, setQuaking]   = useState(false)

  const audioRef        = useRef<HTMLAudioElement | null>(null)
  const revealCalledRef = useRef(false)
  const doneCalledRef   = useRef(false)

  const callReveal = () => {
    if (revealCalledRef.current) return
    revealCalledRef.current = true
    onReveal()
  }

  const callDone = () => {
    if (doneCalledRef.current) return
    doneCalledRef.current = true
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    onDone()
  }

  useEffect(() => {
    const audio = new Audio(`${baseUrl}aurora_reveal.mp3`)
    audio.volume = 0.85
    audioRef.current = audio
    audio.play().catch(() => {})

    const timers = [
      setTimeout(() => setTremor(1),    T_TREMOR_1),
      setTimeout(() => setTremor(2),    T_TREMOR_2),
      setTimeout(() => setTremor(3),    T_TREMOR_3),
      setTimeout(() => {
        setPhase('reveal')
        setQuaking(true)
        callReveal()
        setTimeout(() => { setTremor(0); setQuaking(false) }, T_QUAKE_END - T_REVEAL)
      }, T_REVEAL),
      setTimeout(() => setPhase('invisible'), T_INVISIBLE),
      setTimeout(callDone, T_DONE),
    ]

    return () => {
      timers.forEach(clearTimeout)
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const shakeClass = quaking
    ? 'anim-quake'
    : tremor === 3
      ? 'anim-tremor-3'
      : tremor === 2
        ? 'anim-tremor-2'
        : tremor === 1
          ? 'anim-tremor-1'
          : ''

  // Phase invisible : composant toujours monté (la musique continue) mais rien rendu
  if (phase === 'invisible') return null

  return createPortal(
    // Wrapper fixe qui clip — empêche les gaps aux bords pendant le tremblement
    <div
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {/* Inner légèrement surdimensionné pour absorber le shake sans gaps */}
      <div className={`absolute -inset-4 ${shakeClass}`}>

        {/* ── Phase tension ─────────────────────────────────────────────── */}
        {phase === 'tension' && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center gap-8">
            {/* Scanlines orange */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(249,115,22,0.8) 2px, rgba(249,115,22,0.8) 4px)' }}
            />

            <div className="flex flex-col items-center gap-5 z-10 px-8 text-center">
              <motion.p
                className="text-xs tracking-[0.4em] text-orange-600 uppercase font-terminal"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                ⚠ TRANSMISSION ENTRANTE — NIVEAU PRIORITAIRE
              </motion.p>

              {/* Barre de progression calée sur les 21s */}
              <div className="w-56 h-px bg-orange-900 overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500"
                  style={{ transformOrigin: 'left' }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: T_REVEAL / 1000, ease: 'linear' }}
                />
              </div>

              <motion.p
                className="text-[10px] tracking-[0.3em] text-orange-900 uppercase font-terminal"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.6 }}
              >
                Ne pas interrompre
              </motion.p>
            </div>
          </div>
        )}

        {/* ── Phase reveal ──────────────────────────────────────────────── */}
        {phase === 'reveal' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 1, 0] }}
            transition={{ duration: 2.8, times: [0, 0.25, 0.6, 1], ease: 'easeInOut' }}
          >
            <motion.h1
              className="text-5xl sm:text-7xl font-black uppercase text-black tracking-[0.08em] text-center px-6 leading-tight"
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{ scale: [0.65, 1.08, 1], opacity: [0, 1, 1] }}
              transition={{ duration: 0.55, times: [0, 0.45, 1] }}
            >
              AURORA
            </motion.h1>
          </motion.div>
        )}

      </div>
    </div>,
    document.body
  )
}
