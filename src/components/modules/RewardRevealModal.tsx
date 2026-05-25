import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, ChevronRight, CheckCircle2 } from 'lucide-react'

const REWARDS_PREVIEW = [
  "Intendant privé d'un soir",
  "Petit-déjeuner de luxe",
  "Petit-déjeuner de luxe",
  "Apéro de luxe",
  "Apéro de luxe",
  "Ticket Coupe-file",
]

function medal(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
}

interface Props {
  username: string
  rank: number
  onGoToRewards: () => void
  onClose: () => void
}

export function RewardRevealModal({ username, rank, onGoToRewards, onClose }: Props) {
  const [screen, setScreen] = useState<1 | 2>(1)
  const [agreed, setAgreed] = useState(false)

  const handleClose = () => {
    sessionStorage.setItem('aurora_reward_reveal', '1')
    onClose()
  }

  const handleGoToRewards = () => {
    sessionStorage.setItem('aurora_reward_reveal', '1')
    onGoToRewards()
  }

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 font-terminal">
      <div className="pointer-events-none absolute inset-0 scanlines opacity-10" />

      <AnimatePresence mode="wait">
        {screen === 1 && (
          <motion.div
            key="screen1"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-lg border border-orange-500/60 bg-black/95 p-7 space-y-6"
          >
            {/* Top badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{medal(rank)}</span>
                <p className="text-xs tracking-[0.3em] text-orange-500 uppercase font-bold">
                  Classement Final — Rang {rank}
                </p>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
            </div>

            {/* Message */}
            <div className="space-y-4 border-t border-orange-500/20 pt-5">
              <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">
                — Transmission prioritaire —
              </p>
              <p className="text-base font-bold tracking-wider text-orange-200 uppercase leading-tight">
                Cher {username},
              </p>
              <p className="text-sm tracking-[0.05em] text-orange-400 uppercase font-bold leading-tight">
                Le compte à rebours est terminé.
              </p>
              <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                Suite à de nombreuses suspicions de triche et des anomalies critiques détectées sur le réseau, l'A.U.R.O.R.A CORP s'est concertée en urgence. Pour purger la base de données et rétablir l'équilibre, le classement a été réorganisé, afin de refléter un classement sans triche.
              </p>
              <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                Face à la situation, l'A.U.R.O.R.A CORP a pris une décision radicale : nous récompensons finalement les <span className="text-orange-300 font-bold">6 premiers</span> de ce classement ajusté, et les récompenses ont été modifiées pour l'occasion.
              </p>
            </div>

            {/* Continuer */}
            <button
              onClick={() => setScreen(2)}
              className="w-full flex items-center justify-center gap-2 border border-orange-500/60 bg-orange-500/10 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase hover:bg-orange-500/20 transition-all"
            >
              Continuer
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}

        {screen === 2 && (
          <motion.div
            key="screen2"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-lg border border-orange-500/60 bg-black/95 p-7 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-orange-500" />
              <p className="text-xs tracking-[0.3em] text-orange-400 uppercase font-bold">
                Récompenses — Fin de Mission
              </p>
            </div>

            {/* Rewards list */}
            <div className="space-y-3 border-t border-orange-500/20 pt-4">
              <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">
                Voici les 6 récompenses mises en jeu :
              </p>
              <div className="space-y-1.5">
                {REWARDS_PREVIEW.map((name, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border border-orange-500/20 bg-black/40">
                    <span className="text-orange-600 text-xs flex-shrink-0">→</span>
                    <span className="text-xs tracking-wider uppercase text-orange-200 font-bold">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3 border-t border-orange-500/20 pt-4">
              <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">
                Comment valider ta récompense ?
              </p>
              <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                Le nouveau classement adapté se trouve désormais dans la partie <span className="text-orange-300 font-bold">[&nbsp;RÉCOMPENSES&nbsp;]</span> du site. Tu dois t'y rendre pour valider ton choix.
              </p>
              <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                Le processus de validation se fait dans l'<span className="text-orange-300">ordre strict du nouveau classement</span> : Le 1er choisit son lot parmi les 6 disponibles. Dès qu'il a validé, le bouton s'active pour le 2e qui choisit parmi les 5 restants, puis le 3e choisit parmi les 4 restants, et ainsi de suite jusqu'au 6e.
              </p>
              <p className="text-xs leading-relaxed tracking-wide text-orange-600">
                Rends-toi dans l'onglet pour voir si c'est à ton tour ou pour surveiller l'avancement de la file !
              </p>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group border border-orange-500/20 bg-black/40 p-3 hover:border-orange-500/40 transition-all">
              <div
                onClick={() => setAgreed(v => !v)}
                className={`mt-0.5 h-4 w-4 flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                  agreed ? 'border-orange-500 bg-orange-500' : 'border-orange-700'
                }`}
              >
                {agreed && <CheckCircle2 className="h-3 w-3 text-black" />}
              </div>
              <span className="text-xs leading-relaxed tracking-wide text-orange-500 group-hover:text-orange-400 transition-colors select-none">
                J'ai compris, et je valide
              </span>
            </label>

            {/* CTA */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleGoToRewards}
                disabled={!agreed}
                className={`w-full flex items-center justify-center gap-2 border py-3.5 text-xs tracking-[0.3em] uppercase font-bold transition-all ${
                  agreed
                    ? 'border-orange-400/70 bg-orange-500/15 text-orange-200 hover:bg-orange-500/25 hover:border-orange-400 cursor-pointer'
                    : 'border-orange-500/15 bg-black/20 text-orange-800 cursor-not-allowed'
                }`}
              >
                Accéder aux récompenses
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleClose}
                className="w-full text-xs tracking-widest text-orange-800 hover:text-orange-600 transition-colors py-1.5 uppercase"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  )
}
