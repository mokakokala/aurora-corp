import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { KONAMI_TABLE } from '../../config/constants'

function playKonamiSfx() {
  try {
    const ctx = new AudioContext()
    const now = ctx.currentTime

    // Burst de bruit blanc — le "choc" du flash
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

    // Séquence ascendante — démarrage système
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

    // Tonalité finale — système prêt
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
  const [totem, setTotem] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { playKonamiSfx() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!totem.trim()) return
    const raw = sessionStorage.getItem('aurora_identity')
    const identity = raw ? JSON.parse(raw) as { prenom_totem: string; ip?: string; city?: string } : null
    supabase.from(KONAMI_TABLE).insert([{
      totem: totem.trim(),
      ip: identity?.ip ?? null,
      city: identity?.city ?? null,
    }]).then(({ error }) => { if (error) console.error('konami insert:', error) })
    setSubmitted(true)
    setTimeout(onClose, 2500)
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center font-terminal"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Flashs verts multiples */}
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
        transition={{ delay: 0.85, duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number,number,number,number] }}
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
          Vous êtes trop fort. Contactez un membre de la Aurora Corp, il vous doit un petit apéro pendant le camp !
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.2em] text-green-500 uppercase mb-2">
                › Ton totem ou prénom
              </label>
              <p className="text-xs text-green-700 tracking-wider mb-3">
                Laisse ton identité — juste pour qu'on sache qui a réussi le code.
              </p>
              <input
                type="text"
                value={totem}
                onChange={e => setTotem(e.target.value)}
                placeholder="Totem, si pas de totem, prénom..."
                className="w-full border border-green-500/50 bg-black/60 px-4 py-3 text-sm text-green-100 placeholder-green-900 font-terminal outline-none focus:border-green-400 focus:ring-1 focus:ring-green-500/50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!totem.trim()}
              className="w-full border border-green-500/70 bg-green-500/15 px-6 py-3 text-xs tracking-[0.3em] text-green-300 uppercase transition-all hover:bg-green-500/25 hover:border-green-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Confirmer mon identité
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-2 py-2"
          >
            <p className="text-sm text-green-400 tracking-widest uppercase">✓ Identité enregistrée</p>
            <p className="text-xs text-green-700 tracking-widest">À très bientôt !</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>,
    document.body
  )
}
