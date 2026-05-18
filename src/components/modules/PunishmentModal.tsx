import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { PUNISHMENT_TABLE } from '../../config/constants'

type Phase = 'bypass' | 'listening' | 'rating'

const BARS = Array.from({ length: 12 }, (_, i) => ({
  maxH: Math.random() * 20 + 8,
  dur: 0.3 + Math.random() * 0.4,
  delay: i * 0.06,
}))

function formatTime(s: number) {
  if (!isFinite(s) || isNaN(s)) return '00:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function PunishmentModal({
  punishmentNumber,
  onClose,
}: {
  punishmentNumber: number
  onClose: () => void
}) {
  const isFirst = punishmentNumber === 1
  const [phase, setPhase] = useState<Phase>(isFirst ? 'listening' : 'bypass')
  const [bypassed, setBypassed] = useState(false)
  const [bypassInput, setBypassInput] = useState('')
  const [bypassError, setBypassError] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const lastTimeRef = useRef(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [rating, setRating] = useState<number | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const identity = (() => {
    const raw = sessionStorage.getItem('aurora_identity')
    if (!raw) return null
    try { return JSON.parse(raw) as { prenom_totem: string; age: number; ip?: string; city?: string } }
    catch { return null }
  })()

  useEffect(() => {
    if (phase !== 'listening') return
    const a = audioRef.current
    if (!a) return
    a.currentTime = 0
    lastTimeRef.current = 0
    setCurrentTime(0)
    a.play().catch(() => {})
  }, [phase])

  const handleBypassSubmit = () => {
    if (bypassInput.trim().toLowerCase() === 'crousty') {
      setBypassed(true)
      audioRef.current?.pause()
      setPhase('rating')
    } else {
      setBypassError(true)
      setTimeout(() => setBypassError(false), 2500)
      setBypassInput('')
      setPhase('listening')
    }
  }

  const handleSubmit = async () => {
    if (rating === '') return
    setSubmitting(true)
    try {
      await supabase.from(PUNISHMENT_TABLE).insert([{
        prenom_totem: identity?.prenom_totem ?? 'inconnu',
        age: identity?.age ?? null,
        ip: identity?.ip ?? null,
        city: identity?.city ?? null,
        punishment_number: punishmentNumber,
        bypassed,
        rating: Number(rating),
        comment: comment.trim() || null,
        punished_at: new Date().toISOString(),
      }])
    } catch {}
    setSubmitting(false)
    onClose()
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}punishment.mp3`}
        onTimeUpdate={() => {
          const a = audioRef.current
          if (!a) return
          if (a.currentTime > lastTimeRef.current + 1.5) {
            a.currentTime = lastTimeRef.current
            return
          }
          lastTimeRef.current = a.currentTime
          setCurrentTime(a.currentTime)
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPhase('rating')}
      />

      <motion.div
        className="relative w-full max-w-md border-2 border-red-500 bg-black font-terminal overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ boxShadow: '0 0 60px rgba(239,68,68,0.25), inset 0 0 30px rgba(239,68,68,0.04)' }}
      >
        <div className="pointer-events-none absolute inset-0 scanlines opacity-15 z-10" />

        <div className="border-b border-red-500/50 px-5 py-4 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 blink" />
          <span className="text-xs tracking-[0.4em] text-red-500 uppercase">
            Protocole Punition — Erreur #{punishmentNumber * 5}
          </span>
        </div>

        <div className="p-5 space-y-5">
          <AnimatePresence mode="wait">

            {phase === 'bypass' && (
              <motion.div
                key="bypass"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <p className="text-xs text-red-400/80 tracking-wide leading-relaxed">
                  Tu connais les règles. Mais une chance de t'en sortir rapidement t'est offerte.
                </p>
                <div className="border border-red-500/30 bg-red-950/20 p-4 space-y-3">
                  <p className="text-xs tracking-[0.3em] text-red-600 uppercase">Question secrète :</p>
                  <p className="text-xl tracking-widest text-red-300 font-bold">Tasty ?</p>
                  <input
                    type="text"
                    value={bypassInput}
                    onChange={e => setBypassInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBypassSubmit()}
                    placeholder="Votre réponse..."
                    autoFocus
                    className="w-full border border-red-500/40 bg-black px-3 py-2.5 text-sm text-red-300 placeholder-red-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-all"
                  />
                  <AnimatePresence>
                    {bypassError && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-500 tracking-widest uppercase"
                      >
                        ✗ Mauvaise réponse — conséquences inévitables.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleBypassSubmit}
                  className="w-full border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs tracking-[0.3em] text-red-300 uppercase hover:bg-red-500/20 transition-all"
                >
                  Valider
                </button>
              </motion.div>
            )}

            {phase === 'listening' && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <p className="text-xs text-red-400/80 tracking-wide leading-relaxed">
                  {isFirst
                    ? "5 erreurs. Le système t'inflige une peine appropriée. Écoute ce chef-d'œuvre jusqu'à la dernière seconde."
                    : "Mauvaise réponse. Les conséquences sont inévitables."}
                </p>

                <div className="border border-red-500/30 bg-red-950/10 p-4 space-y-4">
                  <div className="flex items-center justify-between text-xs text-red-700 tracking-widest">
                    <span>EN COURS DE DIFFUSION</span>
                    <span className="tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <div className="h-1 w-full bg-red-950/60 overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${progress * 100}%`, transition: 'width 0.25s linear' }}
                    />
                  </div>
                  <div className="flex justify-center items-end gap-0.5 h-8">
                    {BARS.map((b, i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 bg-red-500/70 rounded-sm"
                        animate={{ height: [4, b.maxH, 4] }}
                        transition={{ repeat: Infinity, duration: b.dur, delay: b.delay }}
                      />
                    ))}
                  </div>
                  <p className="text-center text-xs text-red-800 tracking-[0.3em] uppercase">
                    Pas de raccourci possible.
                  </p>
                </div>
              </motion.div>
            )}

            {phase === 'rating' && (
              <motion.div
                key="rating"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {bypassed ? (
                  <p className="text-xs text-green-500/80 tracking-wide">
                    ✓ Bypass accepté. La notation reste obligatoire.
                  </p>
                ) : (
                  <p className="text-xs text-red-400/80 tracking-wide leading-relaxed">
                    Tu as survécu à l'épreuve. Rends maintenant un jugement objectif.
                  </p>
                )}

                <div className="space-y-2">
                  <label className="block text-xs tracking-[0.25em] text-red-500 uppercase">
                    Attribuez une note de 0 à 10 à ce chef-d'œuvre :
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={rating}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10)
                      if (isNaN(v)) { setRating(''); return }
                      setRating(Math.max(0, Math.min(10, v)))
                    }}
                    placeholder="0 – 10"
                    className="w-full border border-red-500/40 bg-black px-3 py-2.5 text-sm text-red-300 placeholder-red-800 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 transition-all text-center tracking-widest"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs tracking-[0.25em] text-red-700 uppercase">
                    Commentaire (facultatif) :
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={3}
                    placeholder="Vos impressions sincères..."
                    className="w-full border border-red-500/30 bg-black px-3 py-2.5 text-xs text-red-300 placeholder-red-900 outline-none focus:border-red-500/60 transition-all resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={rating === '' || submitting}
                  className="w-full border border-red-500/60 bg-red-500/10 px-4 py-3 text-xs tracking-[0.3em] text-red-300 uppercase hover:bg-red-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : 'Soumettre le verdict'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>,
    document.body
  )
}
