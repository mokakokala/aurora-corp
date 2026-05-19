import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GlitchWrapper } from './components/ui/GlitchWrapper'
import { IntroSequence } from './components/intro/IntroSequence'
import { IdentificationPortal } from './components/portal/IdentificationPortal'
import { Dashboard } from './components/layout/Dashboard'
import { MembersPage } from './components/pages/MembersPage'
import { KonamiOverlay } from './components/modules/KonamiOverlay'
import { useKonamiCode } from './hooks/useKonamiCode'
import { useAdminCode } from './hooks/useAdminCode'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('aurora_auth') === '1')
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
        {introComplete && !authenticated && (
          <IdentificationPortal onSuccess={() => { sessionStorage.setItem('aurora_auth', '1'); setAuthenticated(true) }} />
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
