import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

type Phase = 'flash' | 'glitch' | 'croatia' | 'fadeout'

const TERMINAL_LINES = [
  '[ SIGNAL DÉTECTÉ ]',
  '> Authentification...',
  '> Déchiffrement en cours...',
  '████████████████████ 100%',
  '[ DÉVERROUILLAGE CONFIRMÉ ]',
  '> MISSION ACCOMPLIE',
]

const SPARKLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 9 + 4,
  delay: Math.random() * 3.5,
  duration: Math.random() * 2.5 + 1.8,
  color: (['#FFD700', '#FFFFFF', '#FFE44D', '#FFA500', '#FFFACD'] as const)[i % 5],
}))

// ── Timings ────────────────────────────────────────────────────────────────
// flash   :     0 → 2 000ms  (2s  — on voit bien le 00:00:00)
// glitch  : 2 000 → 7 500ms  (5.5s — temps de lire toutes les lignes)
// croatia : 7 500 → 16 000ms (8.5s — profiter du drapeau + hymne)
// fadeout :16 000 → 17 500ms (1.5s — fondu doux)
// done    :17 500ms
const T_GLITCH  = 2000
const T_CROATIA = 7500
const T_FADEOUT = 16000
const T_DONE    = 17500

function playIntroSounds(ctx: AudioContext) {
  // 3 beeps d'alarme espacés
  ;([[0, 440, 0.2], [0.4, 440, 0.2], [0.9, 880, 0.25]] as [number, number, number][]).forEach(([t, freq, dur]) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.12, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + dur)
    osc.start(ctx.currentTime + t)
    osc.stop(ctx.currentTime + t + dur)
  })

  // Noise burst au passage flash → glitch (t ≈ 2.1s)
  const sr = ctx.sampleRate
  const noiseLen = Math.floor(sr * 0.22)
  const buf = ctx.createBuffer(1, noiseLen, sr)
  const data = buf.getChannelData(0)
  for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3
  const noise = ctx.createBufferSource()
  noise.buffer = buf
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.35, ctx.currentTime + 2.1)
  ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.32)
  noise.connect(ng); ng.connect(ctx.destination)
  noise.start(ctx.currentTime + 2.1)

  // Sweep électronique 2.4 → 3.5s
  const sweep = ctx.createOscillator()
  const sg = ctx.createGain()
  sweep.connect(sg); sg.connect(ctx.destination)
  sweep.type = 'sawtooth'
  sweep.frequency.setValueAtTime(80, ctx.currentTime + 2.4)
  sweep.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 3.5)
  sg.gain.setValueAtTime(0.07, ctx.currentTime + 2.4)
  sg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5)
  sweep.start(ctx.currentTime + 2.4)
  sweep.stop(ctx.currentTime + 3.5)

  // Accord de victoire C5-E5-G5 vers la fin du terminal (t ≈ 5.5s)
  ;([[5.5, 523], [6.0, 659], [6.5, 784]] as [number, number][]).forEach(([t, freq]) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.2, ctx.currentTime + t)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.7)
    osc.start(ctx.currentTime + t)
    osc.stop(ctx.currentTime + t + 0.7)
  })
}

function Checkerboard() {
  const cells = 5
  const size = 22
  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${cells}, ${size}px)`,
        border: '4px solid #1a1a6e',
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 76%, 50% 100%, 0% 76%)',
        filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.7))',
      }}
    >
      {Array.from({ length: cells * cells }).map((_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            backgroundColor: (Math.floor(i / cells) + (i % cells)) % 2 === 0 ? '#CC1414' : '#FFFFFF',
          }}
        />
      ))}
    </div>
  )
}

export function CountdownEndSequence({ onDone, baseUrl }: { onDone: () => void; baseUrl: string }) {
  const [phase, setPhase] = useState<Phase>('flash')
  const [visibleLines, setVisibleLines] = useState(0)
  const doneCalledRef = useRef(false)
  const hymneRef = useRef<HTMLAudioElement | null>(null)

  const callDone = () => {
    if (doneCalledRef.current) return
    doneCalledRef.current = true
    if (hymneRef.current) {
      hymneRef.current.pause()
      hymneRef.current = null
    }
    onDone()
  }

  useEffect(() => {
    let ctx: AudioContext | null = null
    try {
      ctx = new AudioContext()
      playIntroSounds(ctx)
    } catch (_) {}

    const hymneTimer = setTimeout(() => {
      const audio = new Audio(`${baseUrl}hymne_troupe.mp3`)
      audio.volume = 0.8
      hymneRef.current = audio
      audio.play().catch(() => {})
    }, T_CROATIA)

    const t1 = setTimeout(() => setPhase('glitch'),  T_GLITCH)
    const t2 = setTimeout(() => setPhase('croatia'), T_CROATIA)
    const t3 = setTimeout(() => setPhase('fadeout'), T_FADEOUT)
    const t4 = setTimeout(callDone,                  T_DONE)

    return () => {
      ;[hymneTimer, t1, t2, t3, t4].forEach(clearTimeout)
      ctx?.close().catch(() => {})
      if (hymneRef.current) {
        hymneRef.current.pause()
        hymneRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Lignes terminal : une toutes les 700ms
  useEffect(() => {
    if (phase !== 'glitch') return
    setVisibleLines(0)
    const timers = TERMINAL_LINES.map((_, i) =>
      setTimeout(() => setVisibleLines(i + 1), i * 700 + 400)
    )
    return () => timers.forEach(clearTimeout)
  }, [phase])

  const handleSkip = () => {
    if (phase === 'flash') return
    setPhase('fadeout')
    setTimeout(callDone, 1000)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-hidden cursor-pointer select-none"
      onClick={handleSkip}
    >
      <AnimatePresence mode="wait">

        {/* ── Phase 1 : flash des zéros (2s) ── */}
        {phase === 'flash' && (
          <motion.div
            key="flash"
            className="absolute inset-0 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="flex gap-3 sm:gap-5"
              animate={{ filter: ['brightness(1)', 'brightness(2.8)', 'brightness(0.7)', 'brightness(3.5)', 'brightness(1)', 'brightness(1)'] }}
              transition={{ duration: 1.6, times: [0, 0.15, 0.3, 0.45, 0.65, 1] }}
            >
              {([['00', 'Jours'], ['00', 'Heures'], ['00', 'Min'], ['00', 'Sec']] as const).map(([v, l], idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <motion.div
                    className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center text-2xl sm:text-4xl font-terminal tabular-nums"
                    animate={{
                      borderColor: ['#ef4444', '#f97316', '#ef4444', '#ffffff', '#ef4444', '#ef4444'],
                      color:       ['#f97316', '#ef4444', '#f97316', '#ffffff', '#ef4444', '#ef4444'],
                      boxShadow: [
                        '0 0 0px rgba(239,68,68,0)',
                        '0 0 35px rgba(239,68,68,0.9)',
                        '0 0 5px rgba(239,68,68,0.3)',
                        '0 0 70px rgba(255,255,255,1)',
                        '0 0 30px rgba(239,68,68,0.7)',
                        '0 0 20px rgba(239,68,68,0.4)',
                      ],
                    }}
                    style={{ backgroundColor: '#000', borderWidth: 2, borderStyle: 'solid' }}
                    transition={{ duration: 1.6, times: [0, 0.15, 0.3, 0.45, 0.65, 1] }}
                  >
                    {v}
                  </motion.div>
                  <span className="text-xs tracking-[0.2em] text-red-500 uppercase font-terminal">{l}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Phase 2 : terminal glitch (5.5s) ── */}
        {phase === 'glitch' && (
          <motion.div
            key="glitch"
            className="absolute inset-0 bg-black flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Scan lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.8) 2px, rgba(0,255,0,0.8) 4px)',
              }}
            />
            {/* Flicker vert d'entrée */}
            <motion.div
              className="absolute inset-0 pointer-events-none bg-green-500"
              animate={{ opacity: [0, 0.09, 0, 0.05, 0, 0.03, 0] }}
              transition={{ duration: 2.0, times: [0, 0.05, 0.15, 0.3, 0.5, 0.75, 1] }}
            />

            <div className="relative max-w-sm w-full px-8 space-y-2 font-terminal">
              {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`leading-relaxed tracking-wider ${
                    line.includes('MISSION ACCOMPLIE')
                      ? 'text-green-300 text-xl font-bold mt-5 tracking-[0.18em]'
                      : line.includes('100%')
                        ? 'text-green-400 text-base'
                        : line.startsWith('[')
                          ? 'text-green-300 font-bold text-sm'
                          : 'text-green-500 text-sm'
                  }`}
                  style={
                    line.includes('MISSION ACCOMPLIE')
                      ? { textShadow: '0 0 20px rgba(74,222,128,1), 0 0 55px rgba(74,222,128,0.6)' }
                      : undefined
                  }
                >
                  {line}
                </motion.div>
              ))}
              {visibleLines > 0 && visibleLines < TERMINAL_LINES.length && (
                <motion.span
                  className="inline-block w-2.5 h-5 bg-green-400 align-middle"
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.55 }}
                />
              )}
            </div>

            <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] tracking-[0.3em] text-green-900 uppercase font-terminal">
              Appuyer pour passer
            </p>
          </motion.div>
        )}

        {/* ── Phase 3 : révélation Croatie (8.5s) ── */}
        {(phase === 'croatia' || phase === 'fadeout') && (
          <motion.div
            key="croatia"
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'fadeout' ? 0 : 1 }}
            transition={{ duration: phase === 'fadeout' ? 1.5 : 0.8, ease: [0.4, 0, 0.2, 1] }}
            style={{
              background: 'linear-gradient(to bottom, #CC1414 0%, #CC1414 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #003087 66.66%, #003087 100%)',
            }}
          >
            {/* Overlay sombre pour lisibilité */}
            <div className="absolute inset-0 bg-black/22" />

            {/* Sparkles */}
            {SPARKLES.map(s => (
              <motion.div
                key={s.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: s.size,
                  height: s.size,
                  backgroundColor: s.color,
                  boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                }}
                animate={{ opacity: [0, 1, 0], scale: [0, 1.8, 0] }}
                transition={{ repeat: Infinity, duration: s.duration, delay: s.delay, ease: 'easeInOut' }}
              />
            ))}

            {/* Contenu centré */}
            <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 0.9, type: 'spring', stiffness: 160, damping: 14 }}
              >
                <Checkerboard />
              </motion.div>

              <motion.h1
                className="text-5xl sm:text-7xl font-black uppercase leading-tight text-white"
                style={{
                  letterSpacing: '0.08em',
                  textShadow: '3px 3px 0 rgba(0,0,0,0.55), 0 0 50px rgba(255,215,0,0.85)',
                }}
                initial={{ opacity: 0, y: 35, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 1.2, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                ROAD TO
                <br />
                <motion.span
                  animate={{
                    textShadow: [
                      '3px 3px 0 rgba(0,0,0,0.55), 0 0 40px rgba(255,215,0,0.7)',
                      '3px 3px 0 rgba(0,0,0,0.55), 0 0 80px rgba(255,215,0,1)',
                      '3px 3px 0 rgba(0,0,0,0.55), 0 0 40px rgba(255,215,0,0.7)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 3.0, ease: 'easeInOut', delay: 2.2 }}
                >
                  CROATIA
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-xl tracking-[0.35em] text-white/90 uppercase font-terminal"
                style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.7)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5, duration: 0.8 }}
              >
                Troupe de l'Aurore · 2026
              </motion.p>
            </div>

            <p className="absolute bottom-6 left-0 right-0 text-center text-[10px] tracking-[0.3em] text-white/30 uppercase font-terminal">
              Appuyer pour continuer
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>,
    document.body
  )
}
