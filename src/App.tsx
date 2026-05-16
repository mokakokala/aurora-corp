import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GlitchWrapper } from './components/ui/GlitchWrapper'
import { IdentificationPortal } from './components/portal/IdentificationPortal'
import { Dashboard } from './components/layout/Dashboard'
import { MembersPage } from './components/pages/MembersPage'
import { KonamiOverlay } from './components/modules/KonamiOverlay'
import { useKonamiCode } from './hooks/useKonamiCode'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('aurora_auth') === '1')
  const [showMembers, setShowMembers] = useState(false)
  const [showKonami, setShowKonami] = useState(false)
  useKonamiCode(() => setShowKonami(true))

  return (
    <GlitchWrapper>
      {showKonami && <KonamiOverlay onClose={() => setShowKonami(false)} />}
      <AnimatePresence>
        {!authenticated && (
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
