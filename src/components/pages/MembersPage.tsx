import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

interface Member {
  id: string
  morse: string
  isChief: boolean
}

const MEMBERS: Member[] = [
  { id: 'atele',     morse: '.- - . .-.. . / .-.. ..- .--. .. -.',                              isChief: false },
  { id: 'naganja',   morse: '-. .- --. / .- -. .--- .-',                                         isChief: false },
  { id: 'bisanhdi',  morse: '-... .. ... .- -. .... -.. ..',                                     isChief: false },
  { id: 'magot',     morse: '-- .- --. --- - / -.- .... .- -.',                                  isChief: false },
  { id: 'michel',    morse: '-- .. -.-. .... . .-.. .- ... .. -. ..- ...',                       isChief: false },
  { id: 'saintete',  morse: '... .- / ... .- .. -. - . - . / ... .- .. / -..- .. ...-',          isChief: false },
  { id: 'indiana',   morse: '.. -. -.. .. .- -. .- / ... --- ..- ... -.- .. .-.. .-.. ',         isChief: false },
  { id: 'president', morse: '.--. .-. . ... .. -.. . -. - / -... .. --. / .-',                  isChief: true  },
]

const regularMembers = MEMBERS.filter(m => !m.isChief)
const chief = MEMBERS.find(m => m.isChief)!

const itemVariants = {
  hidden:   { opacity: 0, y: 20 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } },
}

function AgentCard({ member, index }: { member: Member; index: number }) {
  return (
    <motion.div variants={itemVariants} className="border border-orange-500/50 bg-black/70 overflow-hidden group">
      <div className="relative overflow-hidden bg-black" style={{ aspectRatio: '3/4' }}>
        <img
          src={`${import.meta.env.BASE_URL}members/${member.id}.svg`}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          style={{ filter: 'brightness(0) saturate(100%) invert(49%) sepia(79%) saturate(2398%) hue-rotate(346deg) brightness(103%) contrast(101%)' }}
          onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
        />
        <div className="absolute top-2 left-2 z-10">
          <span className="font-terminal text-xs text-orange-600 tracking-widest">
            MEMBRE {String(index + 2).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="px-3 py-2.5 border-t border-orange-500/30">
        <p className="font-terminal text-xs text-orange-500 tracking-widest leading-relaxed text-center">
          {member.morse}
        </p>
      </div>
    </motion.div>
  )
}

function ChiefCard({ member }: { member: Member }) {
  return (
    <motion.div
      variants={itemVariants}
      className="border-2 border-orange-400/80 bg-black/80 overflow-hidden"
      style={{ boxShadow: '0 0 50px rgba(249,115,22,0.18), inset 0 0 30px rgba(249,115,22,0.04)' }}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="relative sm:w-52 flex-shrink-0 overflow-hidden bg-black" style={{ aspectRatio: '3/4' }}>
          <img
            src={`${import.meta.env.BASE_URL}members/${member.id}.svg`}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(49%) sepia(79%) saturate(2398%) hue-rotate(346deg) brightness(103%) contrast(101%)' }}
            onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }}
          />
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
          <p className="font-terminal text-xs text-orange-400 tracking-wider leading-loose">
            {member.morse}
          </p>
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

const staggerContainer = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
}

export function MembersPage({ onBack }: { onBack: () => void }) {
  const [introComplete, setIntroComplete] = useState(false)

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
                  Identités masquées — Données chiffrées
                </p>
              </motion.div>

              {/* Chief */}
              <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase mb-3">
                  — Commandement —
                </p>
                <ChiefCard member={chief} />
              </motion.div>

              {/* Regular agents */}
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
                    <AgentCard key={member.id} member={member} index={index} />
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
