import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X, ChevronRight, AlertTriangle } from 'lucide-react'

const REWARDS = [
  { name: "Autorisation d'amener une chaise de camping au camp", desc: "Tu as le permis exceptionnel d'emmener une chaise de camping en Croatie (normalement interdit à l'étranger)." },
  { name: "Ticket coupe-file unique", desc: "Valable une seule fois, il te permet de passer instantanément premier dans n'importe quelle file." },
  { name: "Intendant privé d'un soir", desc: "Tu peux engager un intendant pour qu'il cuisine un soir dans ta patrouille. (Pas valable pour CC)." },
  { name: "Petit-déjeuner de luxe", desc: "Tu te fais livrer ton petit dej. à ton pilo dès ton réveil." },
  { name: "Apéro de luxe", desc: "Tu reçois boisson et snack directement sur la plaine pour te faire un petit apéro trkl." },
]

const FAILLES = [
  { label: '#01', pts: 10, name: 'Le Code Secret du Compte à Rebours', desc: 'Trouver la combinaison exacte à 4 chiffres pour avoir accès au document secret.' },
  { label: '#02', pts: 9,  name: 'La Photo du Bus du Camp', desc: "Débloquer l'accès visuel pour découvrir en exclusivité l'état et l'ambiance du bus qui nous emmènera en Croatie." },
  { label: '#03', pts: 8,  name: 'Le Nouvel Hymne de la Troupe', desc: "Réussir à intercepter le fichier audio pour écouter en avant-première le tout nouvel hymne officiel de la troupe." },
  { label: '#04', pts: 7,  name: "Le Rappeur Préféré d'Obi-Wan Kenobi", desc: 'Trouver la photo du rappeur préféré de chef Obi-Wan Kenobi.' },
  { label: '#05', pts: 6,  name: "La Date et l'Heure du Départ", desc: "Découvrir le jour J et l'heure exacte du rendez-vous pour le grand départ en camp." },
  { label: '#06', pts: 5,  name: 'Les Gorilles en Croatie', desc: 'Découvrir la photo des fameux gorilles Croates, hautement imprévisibles et dangereux sur place.' },
  { label: '#07', pts: 4,  name: "L'Organigramme d'AURORA CORP", desc: "Découvrir l'organigramme secret et la composition de la AURORA CORP." },
  { label: '#08', pts: 4,  name: 'La Nouvelle Musique de Tibo InShape', desc: "Pirater le lecteur pour écouter en avant-première la toute nouvelle production musicale du premier youtubeur de France." },
]

const TOTAL_STEPS = 5

function FrameHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="border-b border-orange-500/30 pb-4">
      <p className="text-xs tracking-[0.35em] text-orange-600 uppercase">{tag}</p>
      <h2 className="mt-1 text-sm tracking-[0.25em] text-orange-300 uppercase font-bold leading-snug">{title}</h2>
    </div>
  )
}

function Step0() {
  return (
    <div className="space-y-4">
      <FrameHeader tag="⚠ INTRUSION DETECTED" title="Accès Non Autorisé" />
      <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
        Comme tu l'as sûrement remarqué, le dashboard interne d'A.U.R.O.R.A CORP a fuité.
        Maintenant, c'est trop tard pour eux… Profites-en&nbsp;!
      </p>
      <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
        Le Réseau de la Résistance a ouvert une brèche. Prends le temps de fouiller ce système
        dans ses moindres recoins. Chaque section, chaque bouton, chaque anomalie cache un secret.
      </p>
    </div>
  )
}

function Step1() {
  return (
    <div className="space-y-4">
      <FrameHeader tag="Classement général" title="Les Récompenses du Camp" />
      <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
        Accumule un maximum de points dès maintenant.
      </p>
      <div className="border border-orange-500/20 bg-orange-900/5 px-4 py-3 space-y-1.5">
        <p className="text-xs text-orange-500 tracking-wider">
          Ces privilèges sont réservés <span className="font-bold text-orange-300">UNIQUEMENT aux 5 premiers</span> du classement général. Chaque récompense est unique et utilisable une seule fois pour tout le camp.
        </p>
        <ul className="text-xs text-orange-600 tracking-wide space-y-1 pl-2 mt-2">
          <li>→ Le 1er choisit sa récompense en premier parmi les 5.</li>
          <li>→ Le 2e choisit parmi les 4 restantes, et ainsi de suite…</li>
          <li>→ Le 5e n'aura pas le choix et héritera automatiquement du dernier lot disponible !</li>
        </ul>
      </div>
      <div className="space-y-2">
        {REWARDS.map((r, i) => (
          <div key={i} className="border border-orange-500/15 bg-black/30 px-3 py-2.5">
            <p className="text-xs font-bold tracking-wider text-orange-200">{r.name}</p>
            <p className="text-xs text-orange-700 tracking-wide leading-relaxed mt-0.5">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step2() {
  return (
    <div className="space-y-4">
      <FrameHeader tag="Système infiltré" title="Registre des Failles à Découvrir" />
      <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
        Les failles suivantes te permettent de gagner des points et de grimper dans le classement,
        mais d'autres surprises t'attendent aussi&nbsp;:
      </p>
      <div className="space-y-2">
        {FAILLES.map((f, i) => (
          <div key={i} className="border border-orange-500/15 bg-black/30 px-3 py-2.5 flex gap-3">
            <div className="flex-shrink-0 text-right min-w-[52px]">
              <p className="text-xs text-orange-600 tracking-wider">Faille {f.label}</p>
              <p className="text-xs font-bold text-orange-400">{f.pts} pts</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold tracking-wider text-orange-200 leading-snug">{f.name}</p>
              <p className="text-xs text-orange-700 tracking-wide leading-relaxed mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step3() {
  return (
    <div className="space-y-4">
      <FrameHeader tag="Avertissement système" title="Appareil Conseillé : Utilise un Ordinateur !" />
      <div className="border border-orange-400/40 bg-orange-900/10 px-4 py-4 space-y-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-300 tracking-wide leading-relaxed font-bold">
            IMPORTANT : Connecte-toi obligatoirement depuis un ORDINATEUR (PC ou Mac).
          </p>
        </div>
        <p className="text-xs text-orange-500 tracking-wide leading-relaxed">
          Le site n'est pas du tout fait pour les téléphones. Si tu restes sur portable, tu vas bloquer
          et rater plein de points car certaines quêtes demandent de passer ta souris sur des éléments
          ou d'utiliser les touches de ton clavier.
        </p>
        <p className="text-xs text-orange-400 tracking-widest uppercase font-bold">
          Mets toutes les chances de ton côté !
        </p>
      </div>
    </div>
  )
}

function Step4() {
  return (
    <div className="space-y-4">
      <FrameHeader tag="⚠ Étape cruciale" title="Création de ton Compte Agent" />
      <div className="border border-orange-500/30 bg-orange-900/5 px-4 py-3">
        <p className="text-xs text-orange-300 tracking-wider font-bold mb-2">LISEZ BIEN AVANT DE CONTINUER !</p>
        <p className="text-xs text-orange-500 tracking-wide leading-relaxed">
          Tout le monde repart de zéro. Même si tu as l'impression d'avoir déjà entré des accès ou
          joué sur le site auparavant, ce n'était pas un compte officiel. Aujourd'hui, tout le monde
          doit obligatoirement se créer un nouveau compte.
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-orange-500 tracking-wider uppercase">Pour sécuriser tes points et sauvegarder ta progression :</p>
        <div className="space-y-2 pl-1">
          <div className="flex items-start gap-2">
            <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
              <span className="text-orange-200 font-bold">Ton Identifiant :</span> Écris ton TOTEM (ou ton Prénom si tu n'en as pas). Fais bien attention à l'orthographe !
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
              <span className="text-orange-200 font-bold">Ton Mot de passe :</span> Choisis un code simple (comme un code à 4 chiffres ou un mot facile) dont tu te rappelleras à coup sûr.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="h-3 w-3 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-400 tracking-wide leading-relaxed">
              <span className="text-orange-200 font-bold">Pour la suite :</span> Dès que ce compte est créé, tu devras réutiliser exactement le même utilisateur et le même mot de passe. Si tu changes une seule lettre, tu créeras un compte vide à 0 point.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function RulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)

  const handleClose = () => {
    setStep(0)
    onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-xl border border-orange-500/60 bg-black/90 font-terminal flex flex-col max-h-[90vh]"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-orange-500/30 flex-shrink-0">
              <div className="flex items-center gap-3">
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">Terminal A.U.R.O.R.A — Instructions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`h-1 rounded-sm transition-all duration-300 ${
                        i === step ? 'w-5 bg-orange-500' : i < step ? 'w-2 bg-orange-700 hover:bg-orange-500' : 'w-2 bg-orange-900/60 hover:bg-orange-700'
                      }`}
                    />
                  ))}
                </div>
                <button onClick={handleClose} className="text-orange-600 hover:text-orange-400 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  {step === 0 && <Step0 />}
                  {step === 1 && <Step1 />}
                  {step === 2 && <Step2 />}
                  {step === 3 && <Step3 />}
                  {step === 4 && <Step4 />}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex-shrink-0 border-t border-orange-500/20 px-6 py-4 flex justify-between gap-3">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="border border-orange-500/40 px-5 py-2.5 text-xs tracking-[0.25em] text-orange-600 uppercase transition-all duration-300 hover:border-orange-500/70 hover:text-orange-400 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              {step < TOTAL_STEPS - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="border border-orange-500/70 bg-orange-500/15 px-5 py-2.5 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="border border-orange-500/70 bg-orange-500/15 px-5 py-2.5 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400"
                >
                  Fermer
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
