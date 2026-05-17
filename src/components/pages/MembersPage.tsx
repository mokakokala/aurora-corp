import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'
import { TARGET_DATE } from '../../config/constants'

interface Member {
  id: string
  morse: string
  realName: string
  isChief: boolean
  faction: string
  secretRole: string
  description: string
}

const MEMBERS: Member[] = [
  {
    id: 'atele',
    morse: '.- - . .-.. . / .-.. ..- .--. .. -.',
    realName: 'Atèle Lupin',
    isChief: false,
    faction: 'Évadés',
    secretRole: 'Master thief & noodles cook',
    description: `Arrivé tout droit de l'Extrême-Orient, Atèle Lupin est un cambrioleur de haut vol (c'est le cas de le dire). Bien qu'il ne se soit jamais fait pincer par les autorités, il n'a jamais osé réellement augmenter l'envergure de ses larcins. Cependant, ses dernières acquisitions comme une Lamborghini Huracán ou un lapin angora de 2m60 peuvent soulever des questions. Aurait-il enfin réussi le casse du siècle, ou aurait-il simplement reçu cet argent d'une source plus mystérieuse ?`,
  },
  {
    id: 'naganja',
    morse: '-. .- --. / .- -. .--- .-',
    realName: 'Nag-anja',
    isChief: false,
    faction: 'Coexistants',
    secretRole: 'Head of toxicology & mycology',
    description: `Fusionnel avec son environnement, les oiseaux se posent sur ses épaules et les arbres semblent se pencher pour l'écouter, probablement parce qu'il leur parle pendant des heures. Nag-anja est un coexistant dans l'âme : là où d'autres verraient une forêt impénétrable, lui voit un salon douillet et une excellente occasion de retirer sa chemise, puis son pantalon, puis le reste. Bien qu'il ait toujours préféré le bruissement des feuilles au bruit de la civilisation, on lui connaît une passion aussi violente qu'inexpliquée pour les ultras du foot, capable de passer d'un om méditatif à un allez l'OM en 0,00002 seconde, réveillant au passage trois familles de sangliers et un hérisson sourd. Mais ces derniers temps, ses séances de communion avec la nature semblent attirer du monde : des inconnus auraient aperçu un homme en tenue d'Adam peinte aux couleurs de son club, vendant champignons et autres racines à une foule de plus en plus nombreuse. Mais qui a bien pu leur communiquer l'adresse ?`,
  },
  {
    id: 'bisanhdi',
    morse: '-... .. ... .- -. .... -.. ..',
    realName: 'Bisanhdi',
    isChief: false,
    faction: 'Survivants',
    secretRole: 'Head of resources & sleep',
    description: `Bisanhdi, surnommé le Dozo, est un survivant dans l'âme : là où d'autres verraient une île hostile, lui voit un lit à ciel ouvert et un garde-manger inépuisable. Car rien ne semble perturber le Dozo, qu'il s'agisse de dormir dans une baignoire, sur un rocher battu par la pluie, ou directement dans son assiette après une carbonade flamande un peu trop copieuse. Bien qu'il ait toujours su tirer parti de ce que la vie lui offre, ses dernières semaines semblent lui réussir particulièrement : carbonade de luxe tous les midis ainsi que des fiançailles soudaines avec Sylvie, le meilleur parti de tout Overijse. Mais des proches du Dozo s'interrogent : ce mariage est-il un véritable mariage d'amour, ou une alliance stratégique d'un tout autre niveau ?`,
  },
  {
    id: 'magot',
    morse: '-- .- --. --- - / -.- .... .- -.',
    realName: 'Magot Khan',
    isChief: false,
    faction: 'Conquérants',
    secretRole: 'Stalker boss — Head of the Hagra & aggressive fights',
    description: `Partout où il passe, l'herbe ne repousse pas et les pleurs se font entendre. Le terrible Magot Khan n'a que deux ambitions : étendre son territoire et agrandir son cheptel, qui ne lui a pourtant jamais semblé assez grand. Car rien ne satisfait davantage le grand Khan que de nouvelles vaches et vachettes, symboles incontestés de richesse et d'autorité dans sa région natale. Bien qu'il n'ait jamais eu besoin de personne pour parvenir à ses fins, son troupeau semble avoir pris une ampleur considérable ces derniers temps. Mais d'où sort donc ce soutien inattendu ?`,
  },
  {
    id: 'michel',
    morse: '-- .. -.-. .... . .-.. .- ... .. -. ..- ...',
    realName: 'Michelasinus',
    isChief: false,
    faction: 'Bâtisseurs',
    secretRole: 'Head of budget & pancakes',
    description: `Partout où il passe, des échafaudages poussent comme des champignons et les permis de construire s'accumulent. Michelasinus est un constructeur fou : chaque mur qu'il voit est une invitation, chaque terrain vague une opportunité. Bien qu'il ait toujours tout construit ou acheté par ses propres moyens, ses récents chantiers semblent avoir pris une ampleur inhabituelle. Car oui, rien ne satisfait davantage Michelasinus qu'une nouvelle structure à ériger. Mais ces derniers temps, ses projets dépassent l'entendement : un pont reliant deux collines qui ne mènent nulle part, ou encore un immeuble dont chaque appartement est livré avec son propre thylacine de compagnie. Aurait-il enfin obtenu les autorisations qu'il réclamait depuis des années, ou quelqu'un lui aurait-il simplement glissé un carnet de chèques sous la porte ?`,
  },
  {
    id: 'saintete',
    morse: '... .- / ... .- .. -. - . - . / ... .- .. / -..- .. ...-',
    realName: 'Sa Sainteté Saï XIV',
    isChief: false,
    faction: 'Croyants',
    secretRole: 'Head of trades & indésirables odors',
    description: `Saint homme depuis l'âge de 17 ans, il est écrit dans la bible de l'ordre de la nouvelle mitre que Saïga dit Saï le grand a accompli de nombreux miracles comme par exemple changer l'eau en limonade Boni ou encore disparaître durant un quadrimestre entier ! Détenteur de vérité cosmique ou pas, toujours est-il que la secte de l'ordre de la nouvelle mitre est une petite ASBL étonnamment lucrative. Mais ces derniers temps, l'augmentation fulgurante de la popularité de ces porteurs de mitre commence à soulever quelques sourcils. Et si quelqu'un les avait aidés… un peu ?`,
  },
  {
    id: 'indiana',
    morse: '.. -. -.. .. .- -. .- / ... --- ..- ... -.- .. .-.. .-.. ',
    realName: 'Indiana Souskill',
    isChief: false,
    faction: 'Explorateurs',
    secretRole: 'Head of security & bikes',
    description: `On dit que la collection complète de Harry Potter ne suffirait pas à couvrir l'entièreté des aventures déjà vécues par cet homme. Australie, Brésil, Luxembourg… cet explorateur des temps modernes les a tous foulés, et bien d'autres encore. Au fil de ses péripéties au gré des alizés, Indiana Souskill a croisé toutes sortes de gens et semble avoir récemment amassé une fortune considérable. Cet enrichissement soudain, pour ce vieux renard endurci, soulève bien des questions. Serait-il dû aux objets antiques subtilisés et revendus à de riches collectionneurs américains… ou cet argent proviendrait-il d'un commerce bien plus mystérieux encore ?`,
  },
  {
    id: 'president',
    morse: '.--. .-. . ... .. -.. . -. - / -... .. --. / .-',
    realName: 'Président Big A',
    isChief: true,
    faction: 'Chef du projet',
    secretRole: 'Aïonyx',
    description: `On ne l'a jamais vu arriver, on ne l'a jamais vu partir, et pourtant les agendas se remplissent tandis que les interrogations demeurent. Le Président Big A, de son vrai nom ⌁ꙮᛏ⌬ꙩ⎔, est un chef de projet aussi redouté que mystérieux : personne ne sait vraiment d'où il vient, ce qu'il fait exactement, ni comment il a obtenu ce titre. Originaire de ᚦ⌂Ꙧᚨ⍙ᚱ, en Slovénie, il dirige son projet depuis ⎔ᚱ⌁ꙮ⌬⍙ᚦꙩ⌂ᛏ Ꙧᚨ⍙⎔⌬ᚱ, prenant ses décisions stratégiques les plus importantes en dansant sur ꙮᛏ⌬⌁ᚦ⍙ de Martin Solveig. Ses associés affirment qu'il communique exclusivement par ⌂ꙩᚨ⌬⍗ᚱ et que ses contrats sont rédigés en ᚦꙦ⎔⌁ᚱ⌬. Mais ces derniers temps, le Président Big A semble orchestrer quelque chose de bien plus grand que prévu. Le projet ꙮᛏ⌂⍙ꙩᚦ serait-il enfin sur le point de se concrétiser, ou le Président continue-t-il simplement à sourire mystérieusement en montant le volume ?`,
  },
]

const SVG_FILTER = 'brightness(0) saturate(100%) invert(49%) sepia(79%) saturate(2398%) hue-rotate(346deg) brightness(103%) contrast(101%)'
const REAL_FILTER = 'invert(1) sepia(1) saturate(5) hue-rotate(335deg) contrast(1.1)'

const regularMembers = MEMBERS.filter(m => !m.isChief)
const chief = MEMBERS.find(m => m.isChief)!

const itemVariants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

const staggerContainer = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

function MemberModal({ member, memberIndex, onClose }: { member: Member; memberIndex: number; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/88 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col border border-orange-500/60 bg-black overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(249,115,22,0.18), inset 0 0 40px rgba(249,115,22,0.03)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 scanlines opacity-10 z-10" />

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-orange-500/40 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
            <span className="font-terminal text-xs tracking-[0.4em] text-orange-500 uppercase">
              Dossier classifié — Membre {String(memberIndex).padStart(2, '0')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-orange-600 hover:text-orange-300 transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Image */}
          <div
            className="relative flex-shrink-0 bg-black border-b sm:border-b-0 sm:border-r border-orange-500/30 overflow-hidden"
            style={{ height: '180px', minHeight: '180px' }}
          >
            <div className="sm:hidden absolute inset-0">
              <img
                src={`${import.meta.env.BASE_URL}members/${member.id}_real.png`}
                alt=""
                className="w-full h-full object-contain"
                style={{ filter: REAL_FILTER }}
                onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
              />
            </div>
          </div>
          <div
            className="hidden sm:block relative flex-shrink-0 bg-black border-r border-orange-500/30 overflow-hidden"
            style={{ width: '192px', minWidth: '192px' }}
          >
            <img
              src={`${import.meta.env.BASE_URL}members/${member.id}_real.png`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain"
              style={{ filter: REAL_FILTER }}
              onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
            />
          </div>

          {/* Text */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <p className="font-terminal text-xs tracking-[0.45em] text-orange-600 uppercase">
                {member.faction}
              </p>
              <h2 className="font-terminal text-sm sm:text-base tracking-[0.25em] text-orange-300 uppercase font-bold">
                {member.realName}
              </h2>
              <p className="font-terminal text-xs tracking-wider text-orange-500/60 italic">
                {member.secretRole}
              </p>
            </div>
            <div className="h-px w-12 bg-orange-500/50" />
            <p className="font-terminal text-xs text-orange-100/75 leading-relaxed tracking-wide">
              {member.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-orange-500/30 px-4 py-2 flex justify-end">
          <span className="font-terminal text-xs text-orange-700/70 tracking-widest uppercase">
            A.U.R.O.R.A Corp — Accès restreint
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AgentCard({ member, index, expired, onSelect }: { member: Member; index: number; expired: boolean; onSelect?: () => void }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`border border-orange-500/50 bg-black/70 overflow-hidden group ${expired ? 'cursor-pointer' : ''}`}
      onClick={expired ? onSelect : undefined}
    >
      <div className="relative overflow-hidden bg-black" style={{ aspectRatio: '3/4' }}>
        <img
          src={expired
            ? `${import.meta.env.BASE_URL}members/${member.id}_real.png`
            : `${import.meta.env.BASE_URL}members/${member.id}.svg`
          }
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ filter: expired ? REAL_FILTER : SVG_FILTER }}
          onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
        />
        <div className="absolute top-2 left-2 z-10">
          <span className="font-terminal text-xs text-orange-600 tracking-widest">
            MEMBRE {String(index + 2).padStart(2, '0')}
          </span>
        </div>
        {expired && (
          <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/12 transition-colors duration-200 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
            <span className="font-terminal text-xs tracking-[0.3em] text-orange-200 uppercase">
              Consulter
            </span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5 border-t border-orange-500/30">
        {expired ? (
          <p className="font-terminal text-xs text-orange-400 tracking-widest leading-relaxed text-center font-bold">
            {member.realName}
          </p>
        ) : (
          <p className="font-terminal text-xs text-orange-500 tracking-widest leading-relaxed text-center">
            {member.morse}
          </p>
        )}
      </div>
    </motion.div>
  )
}

function ChiefCard({ member, expired, onSelect }: { member: Member; expired: boolean; onSelect?: () => void }) {
  return (
    <motion.div
      variants={itemVariants}
      className={`border-2 border-orange-400/80 bg-black/80 overflow-hidden group ${expired ? 'cursor-pointer' : ''}`}
      style={{ boxShadow: '0 0 50px rgba(249,115,22,0.18), inset 0 0 30px rgba(249,115,22,0.04)' }}
      onClick={expired ? onSelect : undefined}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-52 flex-shrink-0 overflow-hidden bg-black" style={{ aspectRatio: '3/4' }}>
          <img
            src={expired
              ? `${import.meta.env.BASE_URL}members/${member.id}_real.png`
              : `${import.meta.env.BASE_URL}members/${member.id}.svg`
            }
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: expired ? REAL_FILTER : SVG_FILTER }}
            onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
          />
          {expired && (
            <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/12 transition-colors duration-200 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100">
              <span className="font-terminal text-xs tracking-[0.3em] text-orange-200 uppercase">
                Consulter
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <div className="space-y-1">
            <p className="text-xs tracking-[0.4em] text-orange-600 uppercase">
              MEMBRE 01
            </p>
            <p className="text-xs tracking-[0.5em] text-orange-400 uppercase">
              DIRECTEUR GÉNÉRAL
            </p>
            <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">
              CHEF DE CORPS — NIVEAU 92i
            </p>
          </div>
          <div className="h-px w-16 bg-orange-500/60" />
          {expired ? (
            <p className="font-terminal text-sm text-orange-400 tracking-wider font-bold">
              {member.realName}
            </p>
          ) : (
            <p className="font-terminal text-xs text-orange-400 tracking-wider leading-loose">
              {member.morse}
            </p>
          )}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
            <span className="font-terminal text-xs text-orange-500 tracking-widest uppercase">
              Signal prioritaire actif
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function MembersPage({ onBack }: { onBack: () => void }) {
  const [introComplete, setIntroComplete] = useState(false)
  const [selectedMember, setSelectedMember] = useState<{ member: Member; index: number } | null>(null)
  const { expired } = useCountdown(TARGET_DATE)

  useEffect(() => {
    const t = setTimeout(() => setIntroComplete(true), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-aurora-bg font-terminal text-orange-100"
    >
      <div className="pointer-events-none fixed inset-0 z-10 scanlines opacity-10" />

      {/* Member modal */}
      <AnimatePresence>
        {selectedMember && (
          <MemberModal
            member={selectedMember.member}
            memberIndex={selectedMember.index}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>

      {/* Intro overlay */}
      <AnimatePresence>
        {!introComplete && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1] }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xs tracking-[0.4em] text-red-500 uppercase"
            >
              ⚠ ACCÈS DOSSIER CLASSIFIÉ
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-sm tracking-[0.3em] text-orange-300 uppercase"
            >
              DÉCLASSIFICATION EN COURS
            </motion.p>
            <div className="w-64 h-px bg-orange-900/50 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.4, 1] }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="text-xs tracking-widest text-orange-600 uppercase"
            >
              8 MEMBRES IDENTIFIÉS
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence>
        {introComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <header className="sticky top-0 z-20 border-b border-orange-500/60 bg-black/90 backdrop-blur-md px-4 py-3">
              <div className="mx-auto flex max-w-5xl items-center gap-4">
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-300 transition-colors duration-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-xs tracking-[0.3em] uppercase">Retour</span>
                </button>
                <div className="h-4 w-px bg-orange-500/40" />
                <span className="text-xs tracking-[0.4em] text-orange-400 uppercase font-bold hidden sm:inline">
                  DOSSIER — CORPORATION A.U.R.O.R.A.
                </span>
              </div>
            </header>

            <main className="mx-auto max-w-5xl p-4 sm:p-6 space-y-8">
              {/* Title block */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="border border-orange-500/50 bg-black/60 p-5 sm:p-7"
              >
                <p className="text-xs tracking-[0.4em] text-orange-500 uppercase mb-2">
                  FICHIERS DÉCLASSIFIÉS — MEMBRES CONFIRMÉS
                </p>
                <h1 className="text-lg sm:text-xl tracking-[0.25em] text-orange-300 uppercase font-bold">
                  Membres de la Corporation
                </h1>
                <p className="text-xs text-orange-600 tracking-widest mt-1 uppercase">
                  {expired
                    ? 'Identités révélées — Cliquez sur un membre pour consulter son dossier'
                    : 'Identités masquées — Données chiffrées'}
                </p>
              </motion.div>

              {/* Chief */}
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase mb-3">
                  — Commandement —
                </p>
                <ChiefCard
                  member={chief}
                  expired={expired}
                  onSelect={expired ? () => setSelectedMember({ member: chief, index: 1 }) : undefined}
                />
              </motion.div>

              {/* Regular members */}
              <div>
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase mb-3">
                  — Corps de membres —
                </p>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                >
                  {regularMembers.map((member, index) => (
                    <AgentCard
                      key={member.id}
                      member={member}
                      index={index}
                      expired={expired}
                      onSelect={expired ? () => setSelectedMember({ member, index: index + 2 }) : undefined}
                    />
                  ))}
                </motion.div>
              </div>

              <div className="text-center py-6">
                <p className="text-xs text-orange-700 tracking-widest uppercase">
                  Fin du dossier — A.U.R.O.R.A CORP — ACCÈS RESTREINT
                </p>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
