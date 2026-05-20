import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Play, Pause } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { KONAMI_TABLE } from '../../config/constants'
import { discoverEasterEgg } from '../../lib/discoverEasterEgg'

function formatTime(s: number) {
  if (!isFinite(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function HymnePlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause() } else { a.play() }
    setPlaying(!playing)
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  const progress = duration ? (current / duration) * 100 : 0

  return (
    <div className="space-y-3">
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}hymne_troupe.mp3`}
        onTimeUpdate={e => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Progress bar */}
      <div
        className="w-full h-1 bg-green-900/50 cursor-pointer relative overflow-hidden"
        onClick={seek}
      >
        <div
          className="h-full bg-green-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="flex items-center justify-center gap-2 border border-green-500/70 bg-green-500/10 px-4 py-2.5 text-xs tracking-[0.3em] text-green-300 uppercase transition-all hover:bg-green-500/20 hover:border-green-400"
        >
          {playing
            ? <Pause className="h-3.5 w-3.5" />
            : <Play className="h-3.5 w-3.5" />
          }
          {playing ? 'Pause' : 'Écouter'}
        </button>

        <span className="text-xs text-green-700 tracking-widest font-terminal tabular-nums">
          {formatTime(current)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  )
}

function playKonamiSfx() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime

    const bufSize = Math.floor(ctx.sampleRate * 0.12)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.3, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    noise.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.13)

    const freqs = [200, 300, 450, 600, 900, 1200]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      const t = now + 0.1 + i * 0.065
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.07, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 0.1)
    })

    const ready = ctx.createOscillator()
    ready.type = 'sine'
    ready.frequency.value = 1200
    const readyGain = ctx.createGain()
    const rt = now + 0.1 + freqs.length * 0.065
    readyGain.gain.setValueAtTime(0, rt)
    readyGain.gain.linearRampToValueAtTime(0.12, rt + 0.04)
    readyGain.gain.setValueAtTime(0.12, rt + 0.28)
    readyGain.gain.exponentialRampToValueAtTime(0.001, rt + 0.55)
    ready.connect(readyGain)
    readyGain.connect(ctx.destination)
    ready.start(rt)
    ready.stop(rt + 0.6)
  } catch {}
}

export function KonamiOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    playKonamiSfx()
    const raw = sessionStorage.getItem('aurora_identity')
    const identity = raw ? JSON.parse(raw) as { prenom_totem: string; ip?: string; city?: string } : null
    supabase.from(KONAMI_TABLE).insert([{
      totem: identity?.prenom_totem ?? 'inconnu',
      ip: identity?.ip ?? null,
      city: identity?.city ?? null,
    }]).then(({ error }) => { if (error) console.error('konami insert:', error) })
    discoverEasterEgg('konami_hymne')
  }, [])

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center font-terminal"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Flash vert */}
      <motion.div
        className="absolute inset-0 bg-green-400"
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 0, 0.75, 0, 0.4, 0] }}
        transition={{ duration: 0.9, times: [0, 0.15, 0.28, 0.48, 0.62, 0.82], ease: 'easeOut' }}
      />
      {/* Fond sombre */}
      <motion.div
        className="absolute inset-0 bg-black/96"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.3 }}
      />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />

      {/* Carte */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4 border-2 border-green-500 bg-black p-7 sm:p-8 space-y-6"
        style={{ boxShadow: '0 0 60px rgba(34,197,94,0.25), inset 0 0 40px rgba(34,197,94,0.04)' }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-green-800 hover:text-green-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center space-y-2">
          <p className="text-xs tracking-[0.4em] text-green-600 uppercase">
            ⚡ Système — Niveau Maximum ⚡
          </p>
          <h2 className="text-lg sm:text-xl tracking-[0.2em] text-green-400 uppercase font-bold">
            ACCÈS ADM SUPRÊME
          </h2>
        </div>

        <div className="h-px bg-green-500/30" />

        <p className="text-sm text-green-300 leading-relaxed tracking-wide text-center">
          Bravo, tu viens d'accéder à la nouvelle hymne de la troupe.
        </p>

        <div className="space-y-2">
          <p className="text-xs tracking-[0.2em] text-green-600 uppercase">› Hymne officielle</p>
          <HymnePlayer />
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
