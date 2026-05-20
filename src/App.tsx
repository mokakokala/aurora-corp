import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { GlitchWrapper } from './components/ui/GlitchWrapper'
import { IntroSequence } from './components/intro/IntroSequence'
import { IdentificationPortal } from './components/portal/IdentificationPortal'
import { OnboardingFlow } from './components/portal/OnboardingFlow'
import { ReturningUserGate } from './components/portal/ReturningUserGate'
import { ServalGate } from './components/portal/ServalGate'
import { Dashboard } from './components/layout/Dashboard'
import { MembersPage } from './components/pages/MembersPage'
import { LeaderboardPage } from './components/pages/LeaderboardPage'
import { RewardsPage } from './components/pages/RewardsPage'
import { KonamiOverlay } from './components/modules/KonamiOverlay'
import { useKonamiCode } from './hooks/useKonamiCode'
import { useAdminCode } from './hooks/useAdminCode'
import { supabase } from './lib/supabase'
import { CONNECTION_LOG_TABLE } from './config/constants'

const SERVAL_AUDIO = 'serval.mp3'

function isServal(name: string) {
  return name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === 'serval'
}

function servalGateAlreadySeen() {
  return localStorage.getItem('serval_gate_seen') === '1'
}

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(
    () => localStorage.getItem('aurora_onboarding_complete') === '1'
  )
  const [returningUser, setReturningUser] = useState<string | null>(null)
  const [servalGate, setServalGate] = useState(false)
  const [introComplete, setIntroComplete] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [showRewards, setShowRewards] = useState(false)
  const [showKonami, setShowKonami] = useState(false)

  const adminCode = useAdminCode()
  useKonamiCode(() => setShowKonami(true))

  useEffect(() => {
    if (!adminCode) return
    const d4 = adminCode[3]
    console.log(
      `%cSi tu lis ceci, tu es un petit malin plein d'avenir,\nmais sache qu'il ne nous reste que ${d4} heures avant la coupure totale.`,
      'color: #ef4444; font-family: monospace; font-size: 18px; font-weight: bold; letter-spacing: 1px; line-height: 2;'
    )
  }, [adminCode])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        let username = ''
        if (!sessionStorage.getItem('aurora_identity')) {
          const { data: userData } = await supabase
            .from('users')
            .select('username, age, ip, city')
            .eq('auth_id', session.user.id)
            .single()
          if (userData) {
            sessionStorage.setItem('aurora_identity', JSON.stringify({
              prenom_totem: userData.username,
              age: userData.age,
              ip: userData.ip,
              city: userData.city,
            }))
            username = userData.username
            supabase.from(CONNECTION_LOG_TABLE).insert([{
              username: userData.username,
              ip: userData.ip,
              city: userData.city,
            }]).then(({ error }) => { if (error) console.error('connection_log insert:', error) })
          }
        } else {
          // sessionStorage déjà présent = même onglet, refresh → dashboard direct
          const identity = JSON.parse(sessionStorage.getItem('aurora_identity')!)
          username = identity.prenom_totem
          if (isServal(username) && !servalGateAlreadySeen()) {
            setServalGate(true)
          } else {
            setAuthenticated(true)
          }
          setIntroComplete(true)
          setAuthLoading(false)
          return
        }
        setReturningUser(username)
        setIntroComplete(true)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthenticated(false)
        setServalGate(false)
        setReturningUser(null)
        sessionStorage.removeItem('aurora_identity')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handlePortalSuccess = () => {
    const raw = sessionStorage.getItem('aurora_identity')
    const identity = raw ? JSON.parse(raw) : null
    if (identity?.prenom_totem && isServal(identity.prenom_totem) && !servalGateAlreadySeen()) {
      setServalGate(true)
    } else {
      setAuthenticated(true)
    }
  }

  const handleReturningContinue = () => {
    if (returningUser && isServal(returningUser) && !servalGateAlreadySeen()) {
      setServalGate(true)
    } else {
      setAuthenticated(true)
    }
    setReturningUser(null)
  }

  if (authLoading) return null

  return (
    <GlitchWrapper>
      <AnimatePresence>
        {showKonami && <KonamiOverlay onClose={() => setShowKonami(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {!introComplete && (
          <IntroSequence onComplete={() => setIntroComplete(true)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {introComplete && returningUser && !authenticated && !servalGate && (
          <ReturningUserGate
            username={returningUser}
            onContinue={handleReturningContinue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {introComplete && !returningUser && !authenticated && !servalGate && !onboardingComplete && (
          <OnboardingFlow onComplete={() => {
            localStorage.setItem('aurora_onboarding_complete', '1')
            setOnboardingComplete(true)
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {introComplete && !returningUser && !authenticated && !servalGate && onboardingComplete && (
          <IdentificationPortal onSuccess={handlePortalSuccess} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {servalGate && !authenticated && (
          <ServalGate
            audioFile={SERVAL_AUDIO}
            onComplete={() => {
              localStorage.setItem('serval_gate_seen', '1')
              setServalGate(false)
              setAuthenticated(true)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {authenticated && !showMembers && !showLeaderboard && !showRewards && (
          <Dashboard
            key="dashboard"
            onDiscoverMembers={() => setShowMembers(true)}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            onShowRewards={() => setShowRewards(true)}
          />
        )}
        {authenticated && showMembers && (
          <MembersPage key="members" onBack={() => setShowMembers(false)} />
        )}
        {authenticated && showLeaderboard && (
          <LeaderboardPage
            key="leaderboard"
            onBack={() => setShowLeaderboard(false)}
            currentUsername={JSON.parse(sessionStorage.getItem('aurora_identity') ?? '{}')?.prenom_totem ?? ''}
          />
        )}
        {authenticated && showRewards && (
          <RewardsPage
            key="rewards"
            onBack={() => setShowRewards(false)}
            currentUsername={JSON.parse(sessionStorage.getItem('aurora_identity') ?? '{}')?.prenom_totem ?? ''}
          />
        )}
      </AnimatePresence>
    </GlitchWrapper>
  )
}
