import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GlitchWrapper } from './components/ui/GlitchWrapper'
import { IntroSequence } from './components/intro/IntroSequence'
import { IdentificationPortal } from './components/portal/IdentificationPortal'
import { ServalGate } from './components/portal/ServalGate'
import { Dashboard } from './components/layout/Dashboard'
import { MembersPage } from './components/pages/MembersPage'
import { KonamiOverlay } from './components/modules/KonamiOverlay'
import { useKonamiCode } from './hooks/useKonamiCode'
import { useAdminCode } from './hooks/useAdminCode'

const SERVAL_AUDIO = 'serval.mp3'

function isServal(name: string) {
  return name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === 'serval'
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('aurora_auth') === '1')
  const [servalGate, setServalGate] = useState(false)
  const adminCode = useAdminCode()

  useEffect(() => {
    if (!adminCode) return
    const d4 = adminCode[3]
    console.log(
      `%cSi tu lis ceci, tu es un petit malin plein d'avenir,\nmais sache qu'il ne nous reste que ${d4} heures avant la coupure totale.`,
      'color: #ef4444; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; line-height: 2;'
    )
  }, [adminCode])
  const [introComplete, setIntroComplete] = useState(authenticated)
  const [showMembers, setShowMembers] = useState(false)
  const [showKonami, setShowKonami] = useState(false)
  useKonamiCode(() => setShowKonami(true))

  return (
    <GlitchWrapper>
      {showKonami && <KonamiOverlay onClose={() => setShowKonami(false)} />}
      <AnimatePresence>
        {!introComplete && (
          <IntroSequence onComplete={() => setIntroComplete(true)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {introComplete && !authenticated && !servalGate && (
          <IdentificationPortal onSuccess={() => {
            const raw = sessionStorage.getItem('aurora_identity')
            const identity = raw ? JSON.parse(raw) : null
            if (identity?.prenom_totem && isServal(identity.prenom_totem)) {
              setServalGate(true)
            } else {
              sessionStorage.setItem('aurora_auth', '1')
              setAuthenticated(true)
            }
          }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {servalGate && !authenticated && (
          <ServalGate
            audioFile={SERVAL_AUDIO}
            onComplete={() => {
              sessionStorage.setItem('aurora_auth', '1')
              setServalGate(false)
              setAuthenticated(true)
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {authenticated && !showMembers && (
          <Dashboard key="dashboard" onDiscoverMembers={() => setShowMembers(true)} />
        )}
        {authenticated && showMembers && (
          <MembersPage key="members" onBack={() => setShowMembers(false)} />
        )}
      </AnimatePresence>
    </GlitchWrapper>
  )
}
