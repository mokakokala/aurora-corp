import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, RotateCcw, X } from 'lucide-react'
import { useCountdown } from '../../hooks/useCountdown'
import { TARGET_DATE, DNA_SCAN_TABLE, EASTER_EGG_VIEWS_TABLE } from '../../config/constants'
import { supabase } from '../../lib/supabase'
import { discoverEasterEgg } from '../../lib/discoverEasterEgg'
import { useAdminCode } from '../../hooks/useAdminCode'
import { PeaceSignModal } from '../ui/PeaceSignModal'

type Step = 'idle' | 'scanning' | 'result'

const SCAN_DURATION = 2600

function normalizeName(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

const MEMBER_FACTIONS: [string, string][] = [
  ['Asio', 'Coexistants'], ['Douc', 'Coexistants'], ['Azandica', 'Coexistants'],
  ['Springbok', 'Coexistants'], ['Warrah', 'Coexistants'], ['Vanneau', 'Coexistants'],
  ['Simon', 'Coexistants'], ['Dario', 'Coexistants'],
  ['Irbis', 'Conquérants'], ['Wipsy', 'Conquérants'], ['Mangabey', 'Conquérants'],
  ['Cariacou', 'Conquérants'], ['Juno', 'Conquérants'], ['Hermine', 'Conquérants'],
  ['Léon', 'Conquérants'], ['Camille', 'Conquérants'],
  ['Entelle', 'Croyants'], ['Musang', 'Croyants'], ['Ondatra', 'Croyants'],
  ['Nayaur', 'Croyants'], ['Folivora', 'Croyants'], ['Kangal', 'Croyants'],
  ['Raphaël', 'Croyants'], ['Michael', 'Croyants'],
  ['Oryx', 'Évadés'], ['Sapajou', 'Évadés'], ['Brocard', 'Évadés'],
  ['Ashera', 'Évadés'], ['Wombat', 'Évadés'], ['Saguinus', 'Évadés'],
  ['Alexis', 'Évadés'],
  ['Ourebi', 'Bâtisseurs'], ['Ailurus', 'Bâtisseurs'], ['Gecko', 'Bâtisseurs'],
  ['Simensis', 'Bâtisseurs'], ['Caracal', 'Bâtisseurs'], ['Harfang', 'Bâtisseurs'],
  ['Jack', 'Bâtisseurs'], ['Nicolas', 'Bâtisseurs'],
  ['Mazama', 'Explorateurs'], ['Mustela', 'Explorateurs'], ['Linsang', 'Explorateurs'],
  ['Dhole', 'Explorateurs'], ['Hydrurga', 'Explorateurs'], ['Caberu', 'Explorateurs'],
  ['Jules', 'Explorateurs'], ['Achille', 'Explorateurs'],
  ['Serval', 'Survivants'], ['Tangara', 'Survivants'], ['Siamang', 'Survivants'],
  ['Galago', 'Survivants'], ['Chaoui', 'Survivants'], ['Zarafa', 'Survivants'],
  ['Capucin', 'Survivants'], ['Florent', 'Survivants'],
]

const FACTION_DESCRIPTIONS: Record<string, string> = {
  'Évadés': "On les aperçoit souvent sur les plages, au large des côtes de l'île, le regard perdu vers l'horizon, ils n'ont jamais vraiment accepté leur arrivée sur cette île. Chacun de leurs gestes, chaque objet qu'ils récupèrent, chaque plan qu'ils esquissent n'ont qu'un seul but : partir. Leurs camps sont fragiles, temporaires, comme s'ils refusaient de s'enraciner. Ils parlent souvent du monde d'avant, comme d'un endroit encore accessible, presque à portée de main. Ils sont guidés par l'espoir d'y retourner un jour. Mais certains parmi les six autres groupes murmurent que plus le temps passe et plus leurs tentatives deviennent désespérées et que même la mer semble les rejeter.\n\nQue fuient-ils vraiment ? L'île ou l'idée d'y rester ?",
  'Conquérants': "Les conquérants ne regardent pas l'horizon, leur regard se tourne vers le cœur de l'île. Dans leurs yeux, elle n'est pas un piège, mais une opportunité. Leur mode de vie est structuré, presque militaire : surveillance, contrôle des ressources, expansion de leur territoire. Leur présence se ressent avant même de les voir : des traces organisées, des structures solides, des silhouettes qui surveillent. Là où ils passent, l'ordre remplace le chaos. Et derrière cet ordre, leur volonté est claire : contrôler. Ils ne demandent pas leur place. Ils la prennent.\n\nCertains racontent que leur force cache des tensions… que le pouvoir attire autant les ennemis que les traîtres. Sur cette île, jusqu'où peut-on aller pour régner ?",
  'Coexistants': "Si vous traversez l'île sans faire de bruit, peut-être ne les verrez-vous jamais. Pourtant, ils sont bien là, en parfaite harmonie avec la nature, discrets, presque invisibles. Ils ne cherchent pas à imposer leur présence. Ils observent, écoutent, s'adaptent. Là où d'autres coupent, eux contournent. Là où d'autres prennent, eux demandent ou attendent. Certains prétendent que les racines et champignons qu'ils consomment leur permettent d'entendre l'île elle-même. Certains disent qu'ils connaissent des choses que les autres ignorent, car l'île leur « répond ».\n\nIllusion ? Sagesse ? Difficile à dire, mais une chose est sûre : on croirait qu'ils faisaient déjà partie de cette île avant même le naufrage.",
  'Bâtisseurs': "Au cœur de l'île, quelque chose prend forme : bien plus qu'un simple campement ou un abri de fortune, quelque chose de plus ambitieux. Les Bâtisseurs ne fuient pas, ils ne subissent pas : ils s'adaptent et transforment. Chaque pierre posée, chaque structure élevée est une déclaration : ils sont prêts à s'installer.\n\nIls recréent des règles, des rôles, une organisation. Une société. Mais certains se demandent… peut-on vraiment reconstruire sans répéter les erreurs du passé ? Et surtout, qui décide de ce que cette « nouvelle civilisation » doit être ?",
  'Explorateurs': "Ils ont été les premiers à disparaître dans la jungle. Leur soif de découverte les a poussés dans les méandres de l'île dès le premier jour. Guidés par une curiosité presque dangereuse, ils s'enfoncent là où personne n'ose aller : grottes, falaises, ruines oubliées, tanières d'animaux inconnus. Ils cherchent, notent et reviennent changés par de nouvelles expériences. Certains parmi eux auraient même vu des phénomènes étranges au sein de l'île, des endroits qui ne devraient pas exister.\n\nAlors la question se pose : explorent-ils l'île, ou quelque chose les attire-t-il plus profondément en elle ?",
  'Croyants': "Pour eux, rien n'est un hasard. Ni le naufrage, ni l'île, ni leur présence ici. Ils voient des signes là où d'autres voient le chaos. Une tempête devient un message. Une rencontre, une épreuve. Une découverte, une révélation. Leurs voix et leurs chants soulagent leurs partisans et inquiètent leurs détracteurs. Car croire donne du sens, mais il n'est jamais bon d'en imposer un.\n\nCertains trouvent chez eux du réconfort. D'autres craignent ce qu'ils pourraient devenir si leurs certitudes grandissent. Et si l'île avait réellement une volonté, seraient-ils les seuls à l'entendre ?",
  'Survivants': "Ils ne sont jamais à un endroit à la fois, ils se déplacent au jour le jour en fonction de la nourriture qu'ils trouvent. Avec eux, pas de grands discours, pas de plans à long terme. Juste des choix, faits au bon moment. Ils avancent, s'adaptent et vivent. Là où d'autres s'épuisent à comprendre ou à contrôler, eux continuent et profitent de ce qu'ils ont.\n\nMais ne vous y trompez pas : ils observent. Ils apprennent et finalement connaissent mieux l'île que beaucoup d'autres groupes.\n\nCertains disent que, si quelqu'un doit survivre jusqu'au bout, ce seront eux. Mais survivre ainsi, est-ce vraiment suffisant ?",
}

const FACTION_DISPLAY_NAMES: Record<string, string> = {
  'evades':       'Évadés',
  'conquerants':  'Conquérants',
  'coexistants':  'Coexistants',
  'batisseurs':   'Bâtisseurs',
  'explorateurs': 'Explorateurs',
  'croyants':     'Croyants',
  'survivants':   'Survivants',
}

const FACTION_MEMBERS_LIST: Record<string, string[]> = {
  'Évadés':       ['Oryx', 'Sapajou', 'Brocard', 'Ashera', 'Wombat', 'Saguinus', 'Alexis'],
  'Conquérants':  ['Irbis', 'Wipsy', 'Mangabey', 'Cariacou', 'Juno', 'Hermine', 'Léon', 'Camille'],
  'Coexistants':  ['Asio', 'Douc', 'Azandica', 'Springbok', 'Warrah', 'Vanneau', 'Simon', 'Dario'],
  'Bâtisseurs':   ['Ourebi', 'Ailurus', 'Gecko', 'Simensis', 'Caracal', 'Harfang', 'Jack', 'Nicolas'],
  'Explorateurs': ['Mazama', 'Mustela', 'Linsang', 'Dhole', 'Hydrurga', '(Caberu)', 'Jules', 'Achille'],
  'Croyants':     ['Entelle', 'Musang', 'Ondatra', 'Nayaur', 'Folivora', 'Kangal', 'Raphaël', 'Michael'],
  'Survivants':   ['Serval', 'Tangara', 'Siamang', 'Galago', 'Chaoui', 'Zarafa', 'Capucin', 'Florent'],
}

function findFactionByName(id: string): string | null {
  if (!id.trim()) return null
  const normalized = normalizeName(id)
  return FACTION_DISPLAY_NAMES[normalized] ?? null
}

function findFaction(id: string): { memberName: string; faction: string } | null {
  if (!id.trim()) return null
  const normalized = normalizeName(id)
  for (const [name, faction] of MEMBER_FACTIONS) {
    if (normalized === normalizeName(name)) {
      return { memberName: name, faction }
    }
  }
  return null
}

function logEasterEggView(slug: string) {
  const raw = sessionStorage.getItem('aurora_identity')
  const identity = raw ? JSON.parse(raw) as { prenom_totem: string; ip?: string; city?: string } : null
  supabase.from(EASTER_EGG_VIEWS_TABLE).insert([{
    easter_egg: slug,
    prenom_totem: identity?.prenom_totem ?? 'inconnu',
    ip: identity?.ip ?? null,
    city: identity?.city ?? null,
  }]).then(({ error }) => { if (error) console.error('easter_egg_views insert:', error) })
}

export function DNAScannerModule({ onDiscoverMembers }: { onDiscoverMembers?: () => void }) {
  const adminCode = useAdminCode()
  const d2 = adminCode?.[1] ?? '?'
  const [step, setStep] = useState<Step>('idle')
  const [input, setInput] = useState('')
  const [submittedId, setSubmittedId] = useState('')
  const [showColettePopup, setShowColettePopup] = useState(false)
  const [showFactionPanel, setShowFactionPanel] = useState(false)
  const [showZoneModal, setShowZoneModal] = useState(false)
  const [showAsheraVideo, setShowAsheraVideo] = useState(false)
  const [showGeckoVideo, setShowGeckoVideo] = useState(false)
  const [showKangalVideo, setShowKangalVideo] = useState(false)
  const [showMangabeyVideo, setShowMangabeyVideo] = useState(false)
  const [showPeaceSign, setShowPeaceSign] = useState(false)
  const [showBickyBurger, setShowBickyBurger] = useState(false)
  const { days, hours, minutes, seconds, expired } = useCountdown(TARGET_DATE)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const scannedId = input.trim()
    setSubmittedId(scannedId)
    setStep('scanning')
    timeoutRef.current = setTimeout(() => {
      setStep('result')
      if (/colette/i.test(scannedId)) { setShowColettePopup(true); logEasterEggView('rappeur_obi_wan'); discoverEasterEgg('rappeur_obi_wan') }
      const raw = sessionStorage.getItem('aurora_identity')
      const identity = raw ? JSON.parse(raw) as { prenom_totem: string; ip?: string; city?: string } : null
      supabase.from(DNA_SCAN_TABLE).insert([{
        logged_as: identity?.prenom_totem ?? 'inconnu',
        scanned_id: scannedId,
        ip: identity?.ip ?? null,
        city: identity?.city ?? null,
      }]).then(({ error }) => { if (error) console.error('dna_scans insert:', error) })
    }, SCAN_DURATION)
  }

  const reset = () => {
    setStep('idle')
    setInput('')
    setSubmittedId('')
    setShowColettePopup(false)
    setShowFactionPanel(false)
    setShowZoneModal(false)
    setShowAsheraVideo(false)
    setShowGeckoVideo(false)
    setShowKangalVideo(false)
    setShowMangabeyVideo(false)
    setShowPeaceSign(false)
    setShowBickyBurger(false)
  }

  const n = normalizeName(submittedId)
  const isVSign = submittedId.trim() === 'V'
  const isBickyBurger = n === 'bicky burger'
  const isAurora = /^a\.?u\.?r\.?o\.?r\.?a\.?(\s+corp\.?)?$/i.test(submittedId.trim())
  const isColette = n === 'colette'
  const isAndalouse = n === 'andalouse' || n === 'pauwels'
  const isMagot = n === 'magot'
  const isSouslik = n === 'souslik'
  const isAtele = n === 'atele'
  const isSaiga = n === 'saiga'
  const isNagor = n === 'nagor'
  const isAonyx = n === 'aonyx' || n === 'aionyx'
  const isBison = n === 'bison'
  const isGecko = n === 'gecko'
  const isCoords = /44[.,]?5170*\d*°?\s*N\s+15[.,]?5313*\d*°?\s*E/i.test(submittedId)

  const isAshera = !expired && /ashera/i.test(submittedId)
  const isKangal = !expired && /kangal/i.test(submittedId)
  const isMangabey = !expired && /mangabey/i.test(submittedId)
  const factionNameMatch = expired ? findFactionByName(submittedId) : null
  const factionMatch = expired && !factionNameMatch ? findFaction(submittedId) : null

  const countdownStr = expired
    ? 'RESTAURATION COMPLÈTE'
    : `${String(days).padStart(2, '0')}j ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`

  return (
    <>
    <PeaceSignModal open={showPeaceSign} onClose={() => setShowPeaceSign(false)} />

    {createPortal(
      <AnimatePresence>
        {showBickyBurger && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowBickyBurger(false)}
          >
            <motion.div
              className="relative w-full max-w-sm border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold leading-relaxed">
                    Félicitations tu viens de découvrir l'état du bus dans lequel on va voyager.
                  </p>
                </div>
                <button
                  onClick={() => setShowBickyBurger(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <img
                  src={`${import.meta.env.BASE_URL}bicky_burger.jpg`}
                  alt="Bicky Burger Gospic"
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {showColettePopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowColettePopup(false)}
          >
            <motion.div
              className="relative w-full max-w-sm border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold uppercase">
                    La voici, LA MADRINA.
                  </p>
                  <p className="text-xs text-orange-600 tracking-widest mt-0.5">
                    Pov : sepadelia
                  </p>
                </div>
                <button
                  onClick={() => setShowColettePopup(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <img
                  src={`${import.meta.env.BASE_URL}colette.PNG`}
                  alt="La Madrina"
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {showZoneModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowZoneModal(false)}
          >
            <motion.div
              className="relative w-full max-w-sm border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold uppercase">Zone classifiée</p>
                  <p className="text-xs text-orange-600 tracking-widest mt-0.5">44.517008° N — 15.53136° E</p>
                </div>
                <button
                  onClick={() => setShowZoneModal(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <img
                  src={`${import.meta.env.BASE_URL}zone_mysterieuse.jpg`}
                  alt="Zone mystérieuse"
                  className="w-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {showAsheraVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowAsheraVideo(false)}
          >
            <motion.div
              className="relative w-full max-w-lg border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold uppercase">Ton edit</p>
                  <p className="text-xs text-orange-600 tracking-widest mt-0.5">Transmission déclassifiée</p>
                </div>
                <button
                  onClick={() => setShowAsheraVideo(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <video
                  src={`${import.meta.env.BASE_URL}ashera_edit.mp4`}
                  controls
                  autoPlay
                  className="w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {showGeckoVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowGeckoVideo(false)}
          >
            <motion.div
              className="relative w-full max-w-lg border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold uppercase">Gecko dans son habitat naturel</p>
                  <p className="text-xs text-orange-600 tracking-widest mt-0.5">Porte de Namur, section 4</p>
                </div>
                <button
                  onClick={() => setShowGeckoVideo(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <video
                  src={`${import.meta.env.BASE_URL}gecko_habitat.mp4`}
                  controls
                  autoPlay
                  className="w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {showKangalVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowKangalVideo(false)}
          >
            <motion.div
              className="relative w-full max-w-lg border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold uppercase">Ton edit</p>
                  <p className="text-xs text-orange-600 tracking-widest mt-0.5">Transmission déclassifiée</p>
                </div>
                <button
                  onClick={() => setShowKangalVideo(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <video
                  src={`${import.meta.env.BASE_URL}kangal_edit.mp4`}
                  controls
                  autoPlay
                  className="w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {showMangabeyVideo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={() => setShowMangabeyVideo(false)}
          >
            <motion.div
              className="relative w-full max-w-lg border-2 border-orange-500/70 bg-black font-terminal"
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-3">
                <div>
                  <p className="text-sm tracking-wider text-orange-300 font-bold uppercase">Ton edit</p>
                  <p className="text-xs text-orange-600 tracking-widest mt-0.5">Transmission déclassifiée</p>
                </div>
                <button
                  onClick={() => setShowMangabeyVideo(false)}
                  className="text-orange-600 hover:text-orange-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-1">
                <video
                  src={`${import.meta.env.BASE_URL}mangabey_edit.mp4`}
                  controls
                  autoPlay
                  className="w-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

    {createPortal(
      <AnimatePresence>
        {showFactionPanel && (() => {
          const panelFaction = factionNameMatch ?? factionMatch?.faction
          if (!panelFaction) return null
          return (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-sm p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => setShowFactionPanel(false)}
            >
              <motion.div
                className="relative w-full max-w-lg border-2 border-orange-500/70 bg-black font-terminal"
                initial={{ scale: 0.92, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 16 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-start justify-between border-b border-orange-500/40 px-5 py-4">
                  <div>
                    <p className="text-xs text-orange-500 tracking-[0.3em] uppercase mb-1">
                      DOSSIER FACTION — DÉCLASSIFIÉ
                    </p>
                    <p className="text-base tracking-wider text-orange-300 font-bold uppercase">
                      Les {panelFaction}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFactionPanel(false)}
                    className="text-orange-600 hover:text-orange-400 transition-colors mt-0.5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-orange-200 leading-relaxed tracking-wide whitespace-pre-line">
                    {FACTION_DESCRIPTIONS[panelFaction]}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>,
      document.body
    )}

    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-orange-500/30 pb-4">
        <Search className="h-4 w-4 text-orange-500" />
        <div>
          <p className="text-xs tracking-[0.3em] text-orange-500 uppercase">Module Gamma</p>
          <h2 className="mt-0.5 text-sm tracking-widest text-orange-200 uppercase font-bold">
            Scanner — Identification
          </h2>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'idle' && (
          <motion.form
            key="idle"
            onSubmit={handleScan}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-xs tracking-[0.2em] text-orange-400 uppercase">
                &gt; Identifiant
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Entrez une séquence d'identification..."
                className="w-full border border-orange-500/50 bg-black/60 px-4 py-3 text-sm text-orange-100 placeholder-orange-600 font-terminal outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex w-full items-center justify-center gap-3 border border-orange-500/70 bg-orange-500/15 px-6 py-3 text-xs tracking-[0.3em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Search className="h-3.5 w-3.5" />
              Lancer l'analyse
            </button>
          </motion.form>
        )}

        {step === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 py-6"
          >
            {/* Animated scan bar */}
            <div className="w-full h-0.5 bg-orange-900/50 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: SCAN_DURATION / 1000, ease: 'linear' }}
              />
            </div>

            <div className="font-terminal text-xs text-orange-400 tracking-widest space-y-1 text-center">
              <motion.p animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 0.9 }}>
                &gt; Analyse en cours...
              </motion.p>
              <p className="text-orange-500">Séquençage : {submittedId.toUpperCase()}</p>
            </div>

            {/* DNA helix dots */}
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="h-2 w-2 rounded-full bg-orange-500"
                  animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1, ease: 'easeInOut' }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-5"
          >
            {/* Result block */}
            <div className={`border p-5 font-terminal space-y-3 ${
              isAurora
                ? 'border-orange-400/80 bg-orange-900/15'
                : isColette
                ? 'border-orange-400/60 bg-orange-900/10'
                : isAndalouse
                ? 'border-yellow-500/60 bg-yellow-900/10'
                : isCoords
                ? 'border-orange-400/80 bg-orange-900/15'
                : factionNameMatch || factionMatch
                ? 'border-orange-400/80 bg-orange-900/15'
                : isBickyBurger
                ? 'border-orange-400/80 bg-orange-900/15'
                : isVSign
                ? 'border-orange-400/80 bg-orange-900/15'
                : 'border-red-500/40 bg-red-900/10'
            }`}>
              <p className="text-xs text-orange-500 tracking-widest">
                &gt; SÉQUENCE : {submittedId.toUpperCase()}
              </p>
              {isAurora ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    IDENTIFIANT CORPORATIF RECONNU — ACCÈS AUX DOSSIERS CLASSIFIÉS
                  </p>
                  <button
                    onClick={() => { onDiscoverMembers?.(); logEasterEggView('organigramme_aurora'); discoverEasterEgg('organigramme_aurora') }}
                    className="mt-1 w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                  >
                    Découvrir les membres de la A.U.R.O.R.A. CORP.
                  </button>
                </>
              ) : isColette ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    IDENTIFICATION CONFIRMÉE — TRANSMISSION EN COURS
                  </p>
                </>
              ) : isAndalouse ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-yellow-400 tracking-wider font-bold leading-relaxed">
                    ⚠ ALERTE LOGISTIQUE
                  </p>
                  <p className="text-xs text-orange-200 leading-relaxed">
                    Seau de 50L de sauce andalouse Pauwels sacrée intact localisé dans la section 4 de la soute. La suprématie du goût est préservée, le moral des troupes est sauvé.
                  </p>
                </>
              ) : factionNameMatch ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    FACTION IDENTIFIÉE — {factionNameMatch.toUpperCase()}
                  </p>
                  <p className="text-xs text-orange-500 tracking-widest uppercase">
                    {FACTION_MEMBERS_LIST[factionNameMatch].length} membres répertoriés
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {FACTION_MEMBERS_LIST[factionNameMatch].map(name => (
                      <span
                        key={name}
                        className="border border-orange-500/50 bg-orange-500/10 px-2.5 py-1 text-xs text-orange-300 font-terminal tracking-wider"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowFactionPanel(true)}
                    className="mt-1 w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                  >
                    En savoir plus sur les {factionNameMatch}
                  </button>
                </>
              ) : factionMatch ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    IDENTIFICATION CONFIRMÉE — ANALYSE COMPLÈTE
                  </p>
                  <p className="text-sm text-orange-200 leading-relaxed">
                    <span className="text-orange-400 font-bold">{factionMatch.memberName}</span>{' '}
                    fait partie des{' '}
                    <span className="text-orange-300 font-bold">{factionMatch.faction}</span>.
                  </p>
                  <button
                    onClick={() => setShowFactionPanel(true)}
                    className="mt-1 w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                  >
                    Découvrir les {factionMatch.faction}
                  </button>
                </>
              ) : isCoords ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    COORDONNÉES RECONNUES — ZONE D'INTÉRÊT CLASSIFIÉE
                  </p>
                  <button
                    onClick={() => { setShowZoneModal(true); logEasterEggView('gorilles_croates'); discoverEasterEgg('gorilles_croates') }}
                    className="mt-1 w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                  >
                    Découvrir cette zone mystérieuse.
                  </button>
                </>
              ) : isAtele ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, un repas de famille doit être partagé à l'instant même, non négociable.
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isSaiga ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, le scan est uniquement destiné à la race non Phoenix, en tant que Phoenix Expert le scan est impossible
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isNagor ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, le Defender n'a pas démarré.
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isAonyx ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, vous voulez sans doute dire Aïonyx, dans tous les cas il lui reste 13 flans a gober, il a pas le temps pour un scan.
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isBison ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, il attend encore le R75.
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isSouslik ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, les vents Alizés de l'hémisphère boréal soufflent bien trop fort.
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isMagot ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    Scan impossible, une sauce bolo en septembre 2023 aurait fait des ravages.
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              ) : isKangal ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    [DONNÉES CORROMPUES DUES À UNE VIOLATION DE L'ARTICLE {d2} DE SÉCURITÉ]
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                  <div className="border-t border-orange-500/20 pt-3 mt-1 space-y-2">
                    <p className="text-xs text-orange-300 leading-relaxed">
                      En attendant pour te faire patienter, profite de ton edit.
                    </p>
                    <button
                      onClick={() => setShowKangalVideo(true)}
                      className="w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                    >
                      Découvrir l'edit
                    </button>
                  </div>
                </>
              ) : isAshera ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    [DONNÉES CORROMPUES DUES À UNE VIOLATION DE L'ARTICLE {d2} DE SÉCURITÉ]
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                  <div className="border-t border-orange-500/20 pt-3 mt-1 space-y-2">
                    <p className="text-xs text-orange-300 leading-relaxed">
                      En attendant pour te faire patienter, profite de ton edit.
                    </p>
                    <button
                      onClick={() => setShowAsheraVideo(true)}
                      className="w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                    >
                      Découvrir l'edit
                    </button>
                  </div>
                </>
              ) : isMangabey ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    [DONNÉES CORROMPUES DUES À UNE VIOLATION DE L'ARTICLE {d2} DE SÉCURITÉ]
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                  <div className="border-t border-orange-500/20 pt-3 mt-1 space-y-2">
                    <p className="text-xs text-orange-300 leading-relaxed">
                      En attendant pour te faire patienter, profite de ton edit.
                    </p>
                    <button
                      onClick={() => setShowMangabeyVideo(true)}
                      className="w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                    >
                      Découvrir l'edit
                    </button>
                  </div>
                </>
              ) : isBickyBurger ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    ÉTABLISSEMENT RÉPERTORIÉ — COORDONNÉES DISPONIBLES
                  </p>
                  <button
                    onClick={() => { setShowBickyBurger(true); logEasterEggView('etat_du_bus'); discoverEasterEgg('etat_du_bus') }}
                    className="mt-1 w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                  >
                    Découvrir où se trouve mon bicky burger
                  </button>
                </>
              ) : isVSign ? (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-orange-300 tracking-wider font-bold leading-relaxed">
                    SIGNATURE BIOMÉTRIQUE NON CONVENTIONNELLE — VÉRIFICATION GESTUELLE REQUISE
                  </p>
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Une confirmation visuelle est nécessaire pour valider cette séquence.
                  </p>
                  <button
                    onClick={() => setShowPeaceSign(true)}
                    className="mt-1 w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                  >
                    Lancer la vérification palmaire
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-orange-300 leading-relaxed">
                    Analyse en cours... Résultat détecté :
                  </p>
                  <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                    [DONNÉES CORROMPUES DUES À UNE VIOLATION DE L'ARTICLE {d2} DE SÉCURITÉ]
                  </p>
                  {isGecko && (
                    <>
                      <p className="text-sm text-red-400 tracking-wider font-bold leading-relaxed">
                        Scan impossible, il est sans doute à Porte de Namur pour un Tasty Crousty.
                      </p>
                      <div className="border-t border-orange-500/20 pt-3 mt-1 space-y-2">
                        <p className="text-xs text-orange-300 leading-relaxed">
                          En attendant on peut te laisser découvrir le gecko dans son habitat naturel.
                        </p>
                        <button
                          onClick={() => setShowGeckoVideo(true)}
                          className="w-full border border-orange-400/70 bg-orange-500/15 px-5 py-3 text-xs tracking-[0.25em] text-orange-300 uppercase transition-all duration-300 hover:bg-orange-500/25 hover:border-orange-300"
                        >
                          Découvrir le gecko dans son habitat naturel
                        </button>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-orange-400 leading-relaxed">
                    Veuillez patienter jusqu'à la restauration système dans :
                  </p>
                  <motion.p
                    className="text-lg text-orange-400 font-terminal tracking-widest"
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    {countdownStr}
                  </motion.p>
                </>
              )}
            </div>

            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 border border-orange-500/50 bg-black/40 px-6 py-3 text-xs tracking-[0.3em] text-orange-500 uppercase transition-all duration-300 hover:text-orange-300 hover:border-orange-500"
            >
              <RotateCcw className="h-3 w-3" />
              Nouvelle analyse
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  )
}
