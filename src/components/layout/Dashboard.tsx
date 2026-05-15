import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Map, Dna, Radio } from 'lucide-react'
import { CountdownModule } from '../modules/CountdownModule'
import { RadarMapModule } from '../modules/RadarMapModule'
import { DNAScannerModule } from '../modules/DNAScannerModule'
import { AudioLogModule } from '../modules/AudioLogModule'

const TABS = [
  { id: 'countdown', label: 'Compte à Rebours', short: 'Compte', icon: Timer, component: CountdownModule },
  { id: 'radar', label: 'Carte Radar', short: 'Radar', icon: Map, component: RadarMapModule },
  { id: 'dna', label: 'Scanner ADN', short: 'Scanner', icon: Dna, component: DNAScannerModule },
  { id: 'audio', label: 'Audio Log', short: 'Audio', icon: Radio, component: AudioLogModule },
] as const

type TabId = (typeof TABS)[number]['id']

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('countdown')
  const [direction, setDirection] = useState(1)

  const changeTab = (id: TabId) => {
    const oldIdx = TABS.findIndex((t) => t.id === activeTab)
    const newIdx = TABS.findIndex((t) => t.id === id)
    setDirection(newIdx > oldIdx ? 1 : -1)
    setActiveTab(id)
  }

  const ActiveComponent = TABS.find((t) => t.id === activeTab)!.component

  return (
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
            <div className="h-2 w-2 rounded-full bg-orange-500 blink" />
            <span className="text-xs tracking-[0.4em] text-orange-400 uppercase font-bold">A.U.R.O.R.A CORP</span>
          </div>
          <span className="text-xs text-orange-500 tracking-widest hidden sm:block">
            TERMINAL ACTIF — CONNEXION SÉCURISÉE
          </span>
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
            <ActiveComponent />
          </motion.section>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-500/30 py-4 px-4 text-center">
        <p className="text-xs text-orange-600 tracking-widest">
          A.U.R.O.R.A CORP — SYSTÈME v2.1.7 — ACCÈS RESTREINT
        </p>
      </footer>
    </div>
  )
}
