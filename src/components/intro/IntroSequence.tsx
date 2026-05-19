import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

type Stage = 'logo' | 'frame1' | 'frame2'

const ORANGE_FILTER = 'brightness(0) saturate(100%) invert(62%) sepia(90%) saturate(800%) hue-rotate(345deg) brightness(95%)'

const BULLET_ITEMS_1 = [
  ['Un compte à rebours', "une fois terminé, il dévoilera bien plus d'informations dans tout le système…"],
  ['Un document classifié', "qui, à l'aide d'un certain code, serait peut-être disponible bien avant le compte à rebours — à vous de fouiller… Attention, ce code se renouvelle régulièrement."],
  ["L'organigramme de la firme", "il existe un moyen d'intercepter les dossiers confidentiels et de voir les noms et l'organigramme des membres de l'A.U.R.O.R.A CORP."],
  ['Une véritable récompense physique', "une des brèches dans le système vous permet de décrocher une récompense qui va vraiment vous mettre fort dans le bueno pendant le camp (réservé aux 5 premiers à trouver)."],
  ['Une apparition mystère', "les rumeurs disent qu'il est possible d'apercevoir le rappeur préféré d'Obi-Wan Kenobi quelque part dans le système..."],
  ['Une musique en exclu', "le tout nouveau son du premier youtubeur de France serait disponible en avant-première…"],
] as const

const BULLET_ITEMS_2 = [
  ['Chaque info se mérite', "un conseil de survivant, gardez vos découvertes pour vous. Ne partagez pas trop vite les anomalies ou les codes que vous trouvez. Toute information partagée à la légère peut avoir de lourdes conséquences sur votre propre aventure. Restez discrets."],
  ['Authentification biométrique', "pour vous enregistrer sur le réseau, vous devez obligatoirement entrer votre vrai totem et votre vrai âge. Le système d'A.U.R.O.R.A CORP ne pardonne pas les fausses identités."],
  ['Optimisation hardware', "pour une immersion totale et pour être capable d'exécuter certaines commandes avancées du système, connectez-vous depuis un ordinateur."],
] as const

export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>('logo')
  const [showHint, setShowHint] = useState(false)
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(false)

  useEffect(() => {
    if (stage !== 'logo') return
    const hintTimer = setTimeout(() => setShowHint(true), 1200)
    const advanceTimer = setTimeout(() => setStage('frame1'), 5000)
    return () => { clearTimeout(hintTimer); clearTimeout(advanceTimer) }
  }, [stage])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black font-terminal p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="pointer-events-none absolute inset-0 scanlines opacity-15" />

      <AnimatePresence mode="wait">

        {/* ── LOGO ── */}
        {stage === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-center gap-6 cursor-pointer select-none"
            onClick={() => setStage('frame1')}
          >
            <img
              src={`${import.meta.env.BASE_URL}Logo troupe.png`}
              alt="A.U.R.O.R.A Corp"
              className="w-56 sm:w-72 md:w-96"
              style={{ filter: ORANGE_FILTER }}
              draggable={false}
            />
            <AnimatePresence>
              {showHint && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0.25, 0.6] }}
                  transition={{ duration: 1 }}
                  className="text-xs tracking-[0.4em] text-orange-800 uppercase"
                >
                  Appuyez pour continuer
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── FRAME 1 ── */}
        {stage === 'frame1' && (
          <motion.div
            key="frame1"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-2xl border border-orange-500/60 bg-black/90 p-6 sm:p-8 flex flex-col gap-5"
          >
            <div className="border-b border-orange-500/30 pb-4 space-y-1 flex-shrink-0">
              <p className="text-xs tracking-[0.35em] text-red-500 uppercase">
                ⚠ Alerte : Portail privé compromis
              </p>
              <h2 className="text-sm sm:text-base tracking-[0.2em] text-orange-300 uppercase font-bold">
                Intrusion infiltrée — Accès non autorisé
              </h2>
            </div>

            <div className="overflow-y-auto max-h-[46vh] space-y-4 text-xs text-orange-200/80 leading-relaxed tracking-wide pr-2">
              <p>
                Le dashboard interne et ultra-sécurisé d'A.U.R.O.R.A CORP a fuité. Vous n'êtes absolument pas censé être connecté à ce système, mais la brèche est ouverte… profitez-en. Prenez le temps de fouiller ce système dans ses moindres recoins. Chaque section, chaque élément et chaque pixel cache des secrets. Rien n'a été laissé au hasard, et ce que vous découvrirez ici pourrait s'avérer vital pour votre survie très prochainement.
              </p>
              <div className="space-y-3">
                <p className="text-orange-500 tracking-widest uppercase text-xs">
                  En fouillant bien, vous pourrez entre autres trouver :
                </p>
                <ul className="space-y-2.5">
                  {BULLET_ITEMS_1.map(([title, desc]) => (
                    <li key={title}>
                      <span className="text-orange-400">• </span>
                      <span className="text-orange-300 font-bold">{title}</span>
                      {' : '}{desc}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-orange-500/30 pt-4 flex flex-col gap-3 flex-shrink-0">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked1}
                  onChange={e => setChecked1(e.target.checked)}
                  className="h-4 w-4 accent-orange-500 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-orange-400 tracking-wide group-hover:text-orange-300 transition-colors">
                  Compris, place à la fouille.
                </span>
              </label>
              <button
                onClick={() => { if (checked1) setStage('frame2') }}
                disabled={!checked1}
                className="flex w-full items-center justify-center gap-2 border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── FRAME 2 ── */}
        {stage === 'frame2' && (
          <motion.div
            key="frame2"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full max-w-2xl border border-orange-500/60 bg-black/90 p-6 sm:p-8 flex flex-col gap-5"
          >
            <div className="border-b border-orange-500/30 pb-4 space-y-1 flex-shrink-0">
              <p className="text-xs tracking-[0.35em] text-red-500 uppercase">
                ⚠ Alerte : Protocole de sécurité intrusion
              </p>
              <h2 className="text-sm sm:text-base tracking-[0.2em] text-orange-300 uppercase font-bold">
                Directives cruciales de sécurité
              </h2>
            </div>

            <div className="overflow-y-auto max-h-[46vh] text-xs text-orange-200/80 leading-relaxed tracking-wide pr-2">
              <ul className="space-y-4">
                {BULLET_ITEMS_2.map(([title, desc]) => (
                  <li key={title}>
                    <span className="text-orange-400">• </span>
                    <span className="text-orange-300 font-bold">{title} : </span>
                    {desc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-orange-500/30 pt-4 flex flex-col gap-3 flex-shrink-0">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked2}
                  onChange={e => setChecked2(e.target.checked)}
                  className="h-4 w-4 accent-orange-500 cursor-pointer flex-shrink-0"
                />
                <span className="text-xs text-orange-400 tracking-wide group-hover:text-orange-300 transition-colors">
                  Je m'engage à respecter les directives.
                </span>
              </label>
              <button
                onClick={() => { if (checked2) onComplete() }}
                disabled={!checked2}
                className="flex w-full items-center justify-center gap-2 border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Accéder au système
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
