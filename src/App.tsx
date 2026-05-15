import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GlitchWrapper } from './components/ui/GlitchWrapper'
import { IdentificationPortal } from './components/portal/IdentificationPortal'
import { Dashboard } from './components/layout/Dashboard'

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => sessionStorage.getItem('aurora_auth') === '1')

  return (
    <GlitchWrapper>
      <AnimatePresence>
        {!authenticated && (
          <IdentificationPortal onSuccess={() => { sessionStorage.setItem('aurora_auth', '1'); setAuthenticated(true) }} />
        )}
      </AnimatePresence>
      {authenticated && <Dashboard />}
    </GlitchWrapper>
  )
}
