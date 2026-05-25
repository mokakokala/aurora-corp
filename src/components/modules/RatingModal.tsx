import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Star } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Props {
  username: string
  onClose: () => void
}

export function RatingModal({ username, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleClose = () => {
    localStorage.setItem('aurora_rating_done', '1')
    onClose()
  }

  const handleSubmit = async () => {
    if (rating === 0 || comment.trim() === '' || submitting) return
    setSubmitting(true)
    await supabase.from('game_ratings').insert([{
      username,
      rating,
      comment: comment.trim(),
    }])
    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      localStorage.setItem('aurora_rating_done', '1')
      onClose()
    }, 1800)
  }

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-terminal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-full max-w-md border border-orange-500/60 bg-black/95 p-7 space-y-6"
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 10 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-4 text-center space-y-2"
            >
              <p className="text-2xl">✓</p>
              <p className="text-sm tracking-[0.2em] text-orange-300 uppercase font-bold">Merci !</p>
              <p className="text-xs text-orange-600 tracking-wide">Ton avis a bien été envoyé.</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-6">
              {/* Header */}
              <div className="space-y-1.5">
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">Fin de l'opération</p>
                <h2 className="text-sm font-bold tracking-[0.2em] text-orange-200 uppercase">
                  Note le jeu
                </h2>
                <p className="text-xs text-orange-500 tracking-wide leading-relaxed">
                  Le compte à rebours est terminé ! Donne-nous ton avis sur l'expérience globale.
                </p>
              </div>

              {/* Stars */}
              <div className="space-y-2">
                <p className="text-xs tracking-[0.2em] text-orange-600 uppercase">Ta note</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          n <= (hovered || rating)
                            ? 'text-orange-400 fill-orange-400'
                            : 'text-orange-900'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <p className="text-xs tracking-[0.2em] text-orange-600 uppercase">
                  Ton message pour les animateurs
                </p>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder="Dis-nous tout..."
                  className="w-full bg-black/60 border border-orange-500/30 text-orange-200 text-xs tracking-wide p-3 resize-none placeholder:text-orange-900 focus:outline-none focus:border-orange-500/60 transition-colors"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 border border-orange-500/20 py-2.5 text-xs tracking-[0.25em] text-orange-800 uppercase hover:text-orange-600 hover:border-orange-500/40 transition-all"
                >
                  Passer
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={rating === 0 || comment.trim() === '' || submitting}
                  className="flex-[2] border border-orange-400/70 bg-orange-500/15 py-2.5 text-xs tracking-[0.25em] text-orange-200 uppercase font-bold hover:bg-orange-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>,
    document.body
  )
}
