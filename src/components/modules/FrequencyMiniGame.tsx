import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause } from 'lucide-react'

const TARGET = 37
const TOLERANCE = 3
const HOLD_MS = 1000
const FREQ_MIN = 20.0
const FREQ_MAX = 70.0

function sliderToMHz(val: number) {
  return FREQ_MIN + (val / 100) * (FREQ_MAX - FREQ_MIN)
}

function getDistortion(val: number) {
  return Math.min(1, Math.abs(val - TARGET) / 40)
}

function formatTime(s: number) {
  if (!isFinite(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function BonusAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const progress = duration > 0 ? current / duration : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="border border-green-500/40 bg-black/70 p-4 space-y-3"
      style={{ boxShadow: '0 0 20px rgba(34,197,94,0.08)' }}
    >
      <p className="text-xs tracking-[0.3em] text-green-500 uppercase">
        Canal 38.5 MHz — Transmission interceptée
      </p>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}signal_b.mp3`}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center border border-green-500/60 bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all flex-shrink-0"
        >
          {playing
            ? <Pause className="h-3.5 w-3.5" />
            : <Play className="h-3.5 w-3.5 ml-0.5" />
          }
        </button>
        <div className="flex-1 space-y-1.5">
          <div className="h-0.5 w-full bg-green-900/40 overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${progress * 100}%`, transition: 'width 0.25s linear' }}
            />
          </div>
          <div className="flex justify-between text-xs font-terminal text-green-700">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function FrequencyMiniGame({
  initiallyUnlocked,
  onUnlock,
  onClose,
}: {
  initiallyUnlocked: boolean
  onUnlock: () => void
  onClose: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const sliderRef = useRef(50)
  const lockedRef = useRef(initiallyUnlocked)

  const [slider, setSlider] = useState(50)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdRafRef = useRef<number>(0)
  const holdStartRef = useRef<number | null>(null)
  const [locked, setLocked] = useState(initiallyUnlocked)

  const gainRef = useRef<GainNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const isInZone = !locked && Math.abs(slider - TARGET) <= TOLERANCE

  useEffect(() => { sliderRef.current = slider }, [slider])

  // Canvas draw loop
  useEffect(() => {
    if (initiallyUnlocked) return // no canvas needed if already unlocked

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.offsetWidth || 460
    const H = 90
    canvas.width = W
    canvas.height = H
    const cy = H / 2
    const amp = H * 0.30
    const cycles = 8

    const draw = () => {
      const dist = lockedRef.current ? 0 : getDistortion(sliderRef.current)
      const t = timeRef.current
      const freqMult = 1 + ((sliderRef.current - TARGET) / Math.max(TARGET, 1)) * 0.45

      ctx.clearRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(249,115,22,0.07)'
      ctx.lineWidth = 0.5
      for (let i = 1; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(0, (H / 4) * i)
        ctx.lineTo(W, (H / 4) * i)
        ctx.stroke()
      }

      // Green target wave
      ctx.beginPath()
      ctx.strokeStyle = `rgba(34,197,94,${0.3 + (1 - dist) * 0.6})`
      ctx.lineWidth = 1.8
      for (let x = 0; x <= W; x++) {
        const y = cy + amp * Math.sin((x / W) * Math.PI * 2 * cycles + t)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Red noisy wave
      ctx.beginPath()
      ctx.strokeStyle = `rgba(239,68,68,${0.3 + dist * 0.6})`
      ctx.lineWidth = 1.8
      for (let x = 0; x <= W; x++) {
        const noise = dist * (Math.random() - 0.5) * amp * 2.8
        const y = cy + amp * Math.sin((x / W) * Math.PI * 2 * cycles * freqMult + t) + noise
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      timeRef.current += 0.045
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [initiallyUnlocked])

  // Audio noise (only when not already unlocked)
  useEffect(() => {
    if (initiallyUnlocked) return

    let source: AudioBufferSourceNode | undefined
    let actx: AudioContext | undefined

    try {
      actx = new AudioContext()
      audioCtxRef.current = actx

      const sr = actx.sampleRate
      const buf = actx.createBuffer(1, sr * 3, sr)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

      source = actx.createBufferSource()
      source.buffer = buf
      source.loop = true

      const gain = actx.createGain()
      gain.gain.value = getDistortion(sliderRef.current) * 0.18
      gainRef.current = gain

      source.connect(gain)
      gain.connect(actx.destination)
      actx.resume().then(() => source!.start())
    } catch {}

    return () => {
      try { source?.stop() } catch {}
      try { actx?.close() } catch {}
    }
  }, [initiallyUnlocked])

  // Update noise volume
  useEffect(() => {
    if (!gainRef.current || !audioCtxRef.current || locked) return
    gainRef.current.gain.setTargetAtTime(
      getDistortion(slider) * 0.18,
      audioCtxRef.current.currentTime,
      0.06,
    )
  }, [slider, locked])

  // Hold progress — only start/stop based on isInZone
  useEffect(() => {
    cancelAnimationFrame(holdRafRef.current)

    if (!isInZone) {
      // Don't reset if we just locked (locked handles its own visual)
      if (!lockedRef.current) {
        holdStartRef.current = null
        setHoldProgress(0)
      }
      return
    }

    holdStartRef.current = performance.now()

    const tick = () => {
      const elapsed = performance.now() - (holdStartRef.current ?? performance.now())
      const progress = Math.min(elapsed / HOLD_MS, 1)
      setHoldProgress(progress)

      if (progress < 1) {
        holdRafRef.current = requestAnimationFrame(tick)
      } else {
        // Silence noise
        if (gainRef.current && audioCtxRef.current) {
          gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.4)
        }
        lockedRef.current = true
        setLocked(true)
        onUnlock()
      }
    }

    holdRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(holdRafRef.current)
  }, [isInZone, onUnlock])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-lg border border-orange-500/60 bg-black font-terminal overflow-hidden"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ boxShadow: '0 0 50px rgba(249,115,22,0.15), inset 0 0 30px rgba(249,115,22,0.03)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 scanlines opacity-10 z-10" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-500/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 w-1.5 rounded-full blink ${locked ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="text-xs tracking-[0.4em] text-orange-500 uppercase">
              Scanner de fréquences
            </span>
          </div>
          <button onClick={onClose} className="text-orange-600 hover:text-orange-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <AnimatePresence mode="wait">
            {locked ? (
              /* ── UNLOCKED STATE ── */
              <motion.div
                key="unlocked"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <p className="text-xs text-green-500/80 tracking-widest uppercase">
                  ✓ Canal déverrouillé — transmission en cours
                </p>
                <BonusAudioPlayer />
              </motion.div>
            ) : (
              /* ── GAME STATE ── */
              <motion.div key="game" className="space-y-5">
                <p className="text-xs text-orange-500/80 leading-relaxed tracking-wide">
                  Signal parasite détecté sur une fréquence adjacente. Déplacez le curseur pour stabiliser manuellement le canal et intercepter la transmission cachée.
                </p>

                {/* Wave canvas */}
                <div className="border border-orange-500/25 bg-black/70 p-3 relative overflow-hidden">
                  <canvas ref={canvasRef} className="w-full block" style={{ height: 90 }} />
                  <div className="pointer-events-none absolute inset-0 interference-lines opacity-15" />
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-xs text-orange-700 tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-5 bg-green-500/60" />
                    <span>Signal cible</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-px w-5 bg-red-500/60" />
                    <span>Signal actuel</span>
                  </div>
                </div>

                {/* Frequency + slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-orange-700 tracking-widest">{FREQ_MIN.toFixed(1)} MHz</span>
                    <motion.span
                      className={`text-sm tracking-[0.3em] font-bold tabular-nums ${isInZone ? 'text-green-400' : 'text-orange-300'}`}
                      animate={isInZone
                        ? { textShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 14px rgba(34,197,94,0.7)', '0 0 0px rgba(34,197,94,0)'] }
                        : { textShadow: '0 0 0px rgba(34,197,94,0)' }
                      }
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    >
                      {sliderToMHz(slider).toFixed(1)} MHz
                    </motion.span>
                    <span className="text-orange-700 tracking-widest">{FREQ_MAX.toFixed(1)} MHz</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={slider}
                    onChange={e => setSlider(Number(e.target.value))}
                    className="w-full accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Status + hold progress */}
                <div className="space-y-2">
                  <span className={`text-xs tracking-widest uppercase ${isInZone ? 'text-green-500' : 'text-orange-700'}`}>
                    {isInZone
                      ? '● Stabilisation en cours — maintenir la position'
                      : '○ Signal instable — ajustez la fréquence'}
                  </span>
                  <div className="h-0.5 w-full bg-orange-900/30 overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${holdProgress * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
