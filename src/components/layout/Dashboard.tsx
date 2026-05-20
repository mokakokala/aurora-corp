import { useState, useEffect } from 'react'
import { usePresence } from '../../hooks/usePresence'
import { useTabTitle } from '../../hooks/useTabTitle'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Map, Search, Radio, LogOut, Trophy, Gift } from 'lucide-react'
import { TARGET_DATE } from '../../config/constants'
import { useCountdown } from '../../hooks/useCountdown'
import { CountdownModule } from '../modules/CountdownModule'
import { RadarMapModule } from '../modules/RadarMapModule'
import { DNAScannerModule } from '../modules/DNAScannerModule'
import { AudioLogModule } from '../modules/AudioLogModule'
import { AdminTerminal } from '../admin/AdminTerminal'
import { TermsModal } from '../ui/TermsModal'
import { supabase } from '../../lib/supabase'

const TABS = [
  { id: 'countdown', label: 'Compte à Rebours', short: 'Compte', icon: Timer, component: CountdownModule },
  { id: 'radar', label: 'Carte Radar', short: 'Radar', icon: Map, component: RadarMapModule },
  { id: 'dna', label: 'Scan', short: 'Scan', icon: Search, component: DNAScannerModule },
  { id: 'audio', label: 'Audio Log', short: 'Audio', icon: Radio, component: AudioLogModule },
] as const

type TabId = (typeof TABS)[number]['id']

const HEADER_STAGES = [
  'A.U.R.O.R.A CORP',
  'A.U.R.O.R.4 C0RP',
  '4.U.R.0.R.4 C0RP',
  '?.U.?.0.?.4 ???P',
  '??.??.??.?? ????',
  'SIGNAL PERDU',
  'Hint : KONAMI',
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

export function Dashboard({ onDiscoverMembers, onShowLeaderboard, onShowRewards }: { onDiscoverMembers: () => void; onShowLeaderboard: () => void; onShowRewards: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('countdown')
  const [direction, setDirection] = useState(1)
  const activeCount = usePresence()
  useTabTitle()

  const [adminClicks, setAdminClicks] = useState(0)
  const [adminOpen, setAdminOpen] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const identity = JSON.parse(sessionStorage.getItem('aurora_identity') ?? '{}')
  const username: string = identity.prenom_totem ?? ''

  // Easter egg 7 — corruption du titre au clic sur le point
  const [dotClicks, setDotClicks] = useState(0)
  useEffect(() => {
    if (dotClicks < HEADER_STAGES.length - 1) return
    const t = setTimeout(() => setDotClicks(0), 3000)
    return () => clearTimeout(t)
  }, [dotClicks])

  // Easter egg 13 — overlay jour J
  const { expired } = useCountdown(TARGET_DATE)
  const [showDayJ, setShowDayJ] = useState(() =>
    TARGET_DATE.getTime() <= Date.now() && !sessionStorage.getItem('aurora_dayj')
  )
  useEffect(() => {
    if (!expired || sessionStorage.getItem('aurora_dayj')) return
    const t = setTimeout(() => setShowDayJ(true), 0)
    return () => clearTimeout(t)
  }, [expired])
  useEffect(() => {
    if (!showDayJ) return
    const t = setTimeout(() => {
      sessionStorage.setItem('aurora_dayj', '1')
      setShowDayJ(false)
    }, 7000)
    return () => clearTimeout(t)
  }, [showDayJ])

  const changeTab = (id: TabId) => {
    const oldIdx = TABS.findIndex((t) => t.id === activeTab)
    const newIdx = TABS.findIndex((t) => t.id === id)
    setDirection(newIdx > oldIdx ? 1 : -1)
    setActiveTab(id)
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab)!.component

  return (
    <>
    {adminOpen && <AdminTerminal onClose={() => setAdminOpen(false)} />}
    <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />

    {/* Easter egg 13 — overlay jour J */}
    <AnimatePresence>
      {showDayJ && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black font-terminal p-8 cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          onClick={() => { sessionStorage.setItem('aurora_dayj', '1'); setShowDayJ(false) }}
        >
          <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />
          <div className="text-center space-y-6 max-w-lg">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xs tracking-[0.4em] text-orange-600 uppercase"
            >
              — TRANSMISSION PRIORITAIRE —
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="text-2xl sm:text-3xl tracking-[0.25em] text-orange-300 uppercase font-bold"
              style={{ textShadow: '0 0 30px rgba(249,115,22,0.6)' }}
            >
              RESTAURATION COMPLÈTE
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.5 }}
              className="text-sm tracking-widest text-orange-400 uppercase"
            >
              FICHIERS DÉCLASSIFIÉS — ACCÈS AUTORISÉ
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.0, duration: 0.5 }}
              className="text-xs tracking-[0.2em] text-orange-500 uppercase"
            >
              OPÉRATION A.U.R.O.R.A — PHASE 2 INITIÉE
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.2, 0.8, 1] }}
              transition={{ delay: 4.5, duration: 0.8 }}
              className="text-xs text-orange-700 tracking-widest pt-4"
            >
              [ APPUYER POUR CONTINUER ]
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="min-h-screen bg-aurora-bg font-terminal text-orange-100">
      {/* Ambient scanline */}
      <div className="pointer-events-none fixed inset-0 z-10 scanlines opacity-10" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        className="sticky top-0 z-20 border-b border-orange-500/60 bg-black/90 backdrop-blur-md px-4 py-3"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-500 blink cursor-pointer"
              onClick={() => setDotClicks(n => Math.min(n + 1, HEADER_STAGES.length - 1))}
              aria-label="Signal A.U.R.O.R.A"
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={dotClicks}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className={`text-xs tracking-[0.4em] uppercase font-bold ${dotClicks >= HEADER_STAGES.length - 1 ? 'text-red-400' : 'text-orange-400'}`}
              >
                {HEADER_STAGES[dotClicks]}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onShowRewards}
              className="flex items-center gap-1.5 text-xs tracking-widest text-orange-600 hover:text-orange-400 transition-colors uppercase"
              title="Récompenses"
            >
              <Gift className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Récompenses</span>
            </button>
            <button
              onClick={onShowLeaderboard}
              className="flex items-center gap-1.5 text-xs tracking-widest text-orange-600 hover:text-orange-400 transition-colors uppercase"
              title="Classement"
            >
              <Trophy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Classement</span>
            </button>
            {username && (
              <span className="text-xs text-orange-600 tracking-widest hidden sm:block">
                {username.toUpperCase()}
              </span>
            )}
            <span
              className="text-xs text-orange-500 tracking-widest hidden sm:block cursor-default select-none"
              onClick={() => {
                const next = adminClicks + 1
                setAdminClicks(next)
                if (next >= 5) {
                  setAdminOpen(true)
                  setAdminClicks(0)
                }
              }}
            >
              TERMINAL ACTIF — CONNEXION SÉCURISÉE
            </span>
          </div>
        </div>
      </motion.header>

      {/* Tab navigation */}
      <nav className="sticky top-[45px] z-20 border-b border-orange-500/60 bg-black/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`flex flex-1 min-w-0 items-center justify-center gap-2 px-3 py-3.5 text-xs tracking-widest uppercase transition-all duration-300 border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                    : 'border-transparent text-orange-500 hover:text-orange-300 hover:bg-orange-500/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.short}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Module content */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.section
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="border border-orange-500/50 bg-black/60 backdrop-blur-sm p-5 sm:p-7"
          >
            {activeTab === 'dna'
              ? <DNAScannerModule onDiscoverMembers={onDiscoverMembers} />
              : <ActiveComponent />
            }
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-500/30 py-4 px-4 text-center space-y-1.5">
        <p className="text-xs text-orange-600 tracking-widest">
          A.U.R.O.R.A CORP — SYSTÈME v2.1.7 — ACCÈS RESTREINT
        </p>
        <p className="text-xs text-orange-700 tracking-widest">
          Réseau :{' '}
          <span className="text-orange-500">
            {activeCount > 0 ? activeCount : '—'}
          </span>{' '}
          {activeCount > 1 ? 'terminaux' : 'terminal'} actuellement actif{activeCount > 1 ? 's' : ''}
        </p>
        <p className="text-xs text-orange-800 tracking-widest">
          <button
            onClick={() => setShowTerms(true)}
            className="hover:text-orange-700 transition-colors cursor-pointer"
          >
            termes et conditions
          </button>
        </p>
        <p className="text-xs text-[#080808] tracking-widest">
          Fast Food No-No Gospic
        </p>
        {username && (
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="text-xs text-orange-800 tracking-widest">
              connecté en tant que <span className="text-orange-600">{username}</span>
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1 text-xs text-orange-900 hover:text-orange-700 transition-colors tracking-widest uppercase"
            >
              <LogOut className="h-2.5 w-2.5" />
              déconnecter
            </button>
          </div>
        )}
      </footer>
    </div>
    </>
  )
}
