import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Send } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { SERVAL_COMMENTS_TABLE } from '../../config/constants'

interface Props {
  onComplete: () => void
  audioFile: string
}

export function ServalGate({ onComplete, audioFile }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    const onEnded = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  const handleSubmit = async () => {
    if (!comment.trim() || submitting) return
    setSubmitting(true)
    await supabase.from(SERVAL_COMMENTS_TABLE).insert([{
      comment: comment.trim(),
      submitted_at: new Date().toISOString(),
    }])
    setSubmitted(true)
    setTimeout(onComplete, 1800)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black p-4 font-terminal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="pointer-events-none absolute inset-0 scanlines opacity-15" />

      <motion.div
        className="w-full max-w-md border border-orange-500/60 bg-black/90 p-8 flex flex-col gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="border-b border-orange-500/30 pb-4">
          <p className="text-xs tracking-[0.35em] text-red-500 uppercase">⚠ Accès restreint détecté</p>
          <h2 className="mt-1 text-sm tracking-[0.2em] text-orange-300 uppercase font-bold">
            Protocole Serval activé
          </h2>
        </div>

        <p className="text-xs text-orange-400/80 tracking-wide leading-relaxed">
          Bon mon petit Serval, tu m'en diras des nouvelles de mon nouveau son.<br />
          Le drop te plaît ? N'hésite pas à dire ce que t'en as pensé et si t'as des conseils.
        </p>

        {/* Audio player */}
        <div className="border border-orange-500/30 bg-black/60 px-4 py-4 flex flex-col gap-3">
          <audio ref={audioRef} src={`${import.meta.env.BASE_URL}${audioFile}`} preload="auto" />

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center border border-orange-500/60 bg-orange-500/10 text-orange-400 transition-all hover:bg-orange-500/20"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <div className="flex-1 h-1 bg-orange-900/40 relative">
              <div
                className="absolute left-0 top-0 h-full bg-orange-500 transition-all duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-orange-600 tracking-widest text-center uppercase">
            {playing ? 'Lecture en cours...' : 'Appuie play pour écouter'}
          </p>
        </div>

        {/* Comment */}
        {!submitted ? (
          <div className="flex flex-col gap-3">
            <label className="text-xs tracking-[0.2em] text-orange-500 uppercase">
              &gt; Laisse un message
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Écris ce que tu veux..."
              className="w-full border border-orange-500/40 bg-black/60 px-3 py-2 text-sm text-orange-100 placeholder-orange-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/40 transition-all duration-200 resize-none"
            />
            <button
              onClick={handleSubmit}
              disabled={!comment.trim() || submitting}
              className="flex w-full items-center justify-center gap-2 border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="h-3 w-3" />
              Envoyer et accéder au système
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <p className="text-sm tracking-[0.3em] text-orange-400 uppercase">
              Message reçu. Accès en cours...
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
