import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gift, Trophy, CheckCircle2, Clock, Lock, Loader2, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { TARGET_DATE } from '../../config/constants'

const REWARDS = [
  {
    id: 1,
    name: "Intendant privé d'un soir",
    description: "Un intendant cuisine pour ta patrouille un soir, valable hors CC.",
  },
  {
    id: 2,
    name: 'Petit-déjeuner de luxe',
    description: "Livré directement à ton pilo au réveil.",
  },
  {
    id: 3,
    name: 'Petit-déjeuner de luxe',
    description: "Livré directement à ton pilo au réveil.",
  },
  {
    id: 4,
    name: 'Apéro de luxe',
    description: "Boisson et snacks servis sur la plaine.",
  },
  {
    id: 5,
    name: 'Apéro de luxe',
    description: "Boisson et snacks servis sur la plaine.",
  },
  {
    id: 6,
    name: 'Ticket Coupe-file',
    description: "Priorité absolue, valable une seule fois.",
  },
]

interface LeaderEntry {
  username: string
  total_points: number
  discoveries_count: number
}

interface RankEntry {
  username: string
}

interface RewardClaim {
  username: string
  reward_id: number
  rank: number
  claimed_at: string
}

function medal(rank: number) {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`
}

export function RewardsPage({ onBack, currentUsername }: { onBack: () => void; currentUsername: string }) {
  const [allLeaders, setAllLeaders] = useState<LeaderEntry[]>([])
  const [claims, setClaims] = useState<RewardClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [manualRanking, setManualRanking] = useState<string[] | null>(null)
  const [pendingReward, setPendingReward] = useState<{ id: number; name: string } | null>(null)

  const fetchData = useCallback(async () => {
    const [leadRes, claimRes, hiddenRes, rankRes] = await Promise.all([
      supabase.from('leaderboard').select('username, total_points, discoveries_count').order('total_points', { ascending: false }),
      supabase.from('reward_claims').select('*').order('claimed_at', { ascending: true }),
      supabase.from('hidden_users').select('username'),
      supabase.from('admin_config').select('value').eq('key', 'manual_ranking').maybeSingle(),
    ])
    const hidden = ((hiddenRes.data ?? []) as { username: string }[]).map(r => r.username)
    const leadersData = (leadRes.data ?? []) as LeaderEntry[]
    setAllLeaders(leadersData.filter(l => !hidden.includes(l.username.toLowerCase())))
    setClaims((claimRes.data ?? []) as RewardClaim[])

    const rankData = rankRes.data as { value: string } | null
    if (rankData?.value) {
      try {
        const parsed = JSON.parse(rankData.value)
        setManualRanking(Array.isArray(parsed) && parsed.length > 0 ? parsed : null)
      } catch {
        setManualRanking(null)
      }
    } else {
      setManualRanking(null)
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('rewards_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reward_claims' }, () => {
        fetchData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchData])

  const missionComplete = Date.now() >= TARGET_DATE.getTime()

  const top6: RankEntry[] = manualRanking
    ? manualRanking.slice(0, 6).map(name => ({ username: name }))
    : allLeaders.slice(0, 6)

  const currentUserRank = top6.findIndex(
    l => l.username.toLowerCase() === currentUsername.toLowerCase()
  ) + 1
  const myClaim = claims.find(c => c.username.toLowerCase() === currentUsername.toLowerCase())
  const currentTurn = claims.length + 1
  const isMyTurn = missionComplete && currentUserRank > 0 && currentUserRank === currentTurn && !myClaim

  const handleRewardClick = (reward: { id: number; name: string }) => {
    if (!isMyTurn || claiming) return
    if (claims.find(c => c.reward_id === reward.id)) return
    setPendingReward(reward)
  }

  const handleConfirm = async () => {
    if (!pendingReward || !isMyTurn || claiming) return
    setClaiming(true)
    setPendingReward(null)
    const { error } = await supabase.from('reward_claims').insert([{
      username: currentUsername,
      reward_id: pendingReward.id,
      rank: currentUserRank,
    }])
    if (!error) await fetchData()
    setClaiming(false)
  }

  return (
    <>
    <motion.div
      className="min-h-screen bg-aurora-bg font-terminal text-orange-100"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="pointer-events-none fixed inset-0 z-10 scanlines opacity-10" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-orange-500/60 bg-black/90 backdrop-blur-md px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs tracking-widest text-orange-600 hover:text-orange-400 transition-colors uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Gift className="h-4 w-4 text-orange-500" />
            <span className="text-xs tracking-[0.3em] text-orange-400 uppercase font-bold">Récompenses — Fin de Mission</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 sm:p-6 space-y-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Banner */}
            <div className={`border p-6 text-center space-y-2 ${missionComplete ? 'border-orange-500/50 bg-orange-900/10' : 'border-orange-500/20 bg-black/40'}`}>
              <p className="text-xs tracking-[0.4em] text-orange-600 uppercase">
                {missionComplete ? 'Opération Aurora — Terminée' : 'Opération Aurora — En cours'}
              </p>
              <h1 className="text-xl font-bold tracking-[0.3em] text-orange-300 uppercase">
                {missionComplete ? 'Mission Accomplie' : 'Récompenses'}
              </h1>
              <p className="text-xs text-orange-700 tracking-wider">
                {missionComplete
                  ? "Le top 6 choisit ses récompenses dans l'ordre du classement final ajusté."
                  : "Les choix seront débloqués à la fin du compte à rebours. Voici un aperçu des récompenses."}
              </p>
            </div>

            {/* Notice pré-compte-à-rebours */}
            {!missionComplete && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-orange-700/40 bg-orange-950/20 p-5 space-y-3"
              >
                <div className="flex items-center gap-2 border-b border-orange-700/30 pb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                  <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">Avis — A.U.R.O.R.A CORP</p>
                </div>
                <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                  Suite à de nombreuses anomalies détectées sur le réseau et des suspicions de triche, l'A.U.R.O.R.A CORP s'est concertée en urgence. Les récompenses ont été modifiées en conséquence.
                </p>
                <p className="text-xs leading-relaxed tracking-wide text-orange-600">
                  Un <span className="text-orange-300 font-bold">nouveau classement ajusté</span> sera révélé à la fin du compte à rebours, afin de refléter les résultats sans triche. Les récompenses ci-dessous sont celles qui seront mises en jeu.
                </p>
              </motion.div>
            )}

            {/* Anti-cheat notice — visible par tous une fois la mission terminée */}
            {missionComplete && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-orange-700/50 bg-orange-950/30 p-5 space-y-3"
              >
                <div className="flex items-center gap-2 border-b border-orange-700/30 pb-3">
                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                  <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">Décision de l'A.U.R.O.R.A CORP</p>
                </div>
                <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                  Suite à de nombreuses suspicions de triche et des anomalies critiques détectées sur le réseau, l'A.U.R.O.R.A CORP s'est concertée en urgence. Pour purger la base de données et rétablir l'équilibre, le classement a été réorganisé, afin de refléter un classement sans triche.
                </p>
                <p className="text-xs leading-relaxed tracking-wide text-orange-500">
                  Face à la situation, l'A.U.R.O.R.A CORP a pris une décision radicale : nous récompensons finalement les <span className="text-orange-300 font-bold">6 premiers</span> de ce classement ajusté, et les récompenses ont été modifiées pour l'occasion.
                </p>
              </motion.div>
            )}

            {/* Top 6 — uniquement après la fin du compte à rebours */}
            {missionComplete && <div className="border border-orange-500/30 bg-black/60 p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-orange-500/20 pb-3">
                <Trophy className="h-3.5 w-3.5 text-orange-600" />
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">
                  Classement Final — Top 6{manualRanking ? ' (Ajusté)' : ''}
                </p>
              </div>
              {top6.length === 0 ? (
                <p className="text-xs text-orange-700 py-4 text-center">Classement en attente.</p>
              ) : (
                <div className="space-y-2">
                  {top6.map((entry, i) => {
                    const rank = i + 1
                    const claim = claims.find(c => c.username.toLowerCase() === entry.username.toLowerCase())
                    const isCurrentTurnPlayer = rank === currentTurn && !claim
                    const isMe = entry.username.toLowerCase() === currentUsername.toLowerCase()
                    const chosenReward = claim ? REWARDS.find(r => r.id === claim.reward_id) : null
                    const leaderData = allLeaders.find(l => l.username.toLowerCase() === entry.username.toLowerCase())
                    return (
                      <div
                        key={entry.username}
                        className={`flex items-center gap-3 px-4 py-3 border ${
                          isMe
                            ? 'border-orange-400/60 bg-orange-500/10'
                            : 'border-orange-500/20 bg-black/40'
                        }`}
                      >
                        <span className="w-7 text-center text-sm flex-shrink-0">{medal(rank)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm tracking-wider uppercase font-bold ${isMe ? 'text-orange-300' : 'text-orange-200'}`}>
                            {entry.username}
                            {isMe && <span className="ml-2 text-xs text-orange-500 normal-case font-normal tracking-widest">(toi)</span>}
                          </p>
                          {chosenReward && (
                            <p className="text-xs text-orange-500 tracking-wider mt-0.5">→ {chosenReward.name}</p>
                          )}
                          {!chosenReward && missionComplete && isCurrentTurnPlayer && (
                            <p className="text-xs text-orange-400 tracking-wider mt-0.5 animate-pulse">En train de choisir...</p>
                          )}
                          {!chosenReward && missionComplete && !isCurrentTurnPlayer && (
                            <p className="text-xs text-orange-800 tracking-wider mt-0.5">En attente</p>
                          )}
                        </div>
                        {/* Points uniquement si classement auto */}
                        {!manualRanking && leaderData && (
                          <span className="text-xs text-orange-700 tracking-widest flex-shrink-0">{leaderData.total_points} pts</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>}

            {/* Status banner for current user */}
            {currentUserRank > 0 && (
              <div className={`border p-4 text-center ${
                myClaim
                  ? 'border-green-500/30 bg-green-900/10'
                  : isMyTurn
                  ? 'border-orange-400/60 bg-orange-500/10'
                  : 'border-orange-500/20 bg-black/40'
              }`}>
                {myClaim ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <p className="text-xs tracking-widest text-green-400 uppercase">
                      Tu as choisi : {REWARDS.find(r => r.id === myClaim.reward_id)?.name}
                    </p>
                  </div>
                ) : !missionComplete ? (
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-orange-700" />
                    <p className="text-xs tracking-widest text-orange-700 uppercase">
                      Tu es dans le top 6 — choix disponible à la fin du compte à rebours
                    </p>
                  </div>
                ) : isMyTurn ? (
                  <p className="text-xs tracking-[0.3em] text-orange-300 uppercase animate-pulse">
                    C'est ton tour — Choisis ta récompense ci-dessous
                  </p>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-orange-700" />
                    <p className="text-xs tracking-widest text-orange-700 uppercase">
                      En attente du rang {currentTurn}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rewards grid */}
            <div className="space-y-3">
              <p className="text-xs tracking-[0.3em] text-orange-600 uppercase border-b border-orange-500/20 pb-2">
                &gt; Récompenses disponibles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REWARDS.map((reward, i) => {
                  const claim = claims.find(c => c.reward_id === reward.id)
                  const isClaimedByMe = claim?.username.toLowerCase() === currentUsername.toLowerCase()
                  const isClaimed = !!claim
                  const canClaim = isMyTurn && !isClaimed && !claiming

                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.25 }}
                      onClick={() => canClaim && handleRewardClick(reward)}
                      className={`border p-4 space-y-2 transition-all ${
                        isClaimedByMe
                          ? 'border-green-500/40 bg-green-900/10'
                          : isClaimed
                          ? 'border-orange-500/10 bg-black/20 opacity-40'
                          : canClaim
                          ? 'border-orange-400/60 bg-orange-900/10 cursor-pointer hover:bg-orange-500/15 hover:border-orange-400'
                          : 'border-orange-500/20 bg-black/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm tracking-wider uppercase font-bold leading-tight ${
                          isClaimedByMe ? 'text-green-300' : isClaimed ? 'text-orange-800' : 'text-orange-200'
                        }`}>
                          {reward.name}
                        </p>
                        {isClaimedByMe && <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />}
                        {isClaimed && !isClaimedByMe && <Lock className="h-4 w-4 text-orange-800 flex-shrink-0 mt-0.5" />}
                      </div>
                      <p className={`text-xs leading-relaxed tracking-wide ${
                        isClaimed && !isClaimedByMe ? 'text-orange-900' : 'text-orange-600'
                      }`}>
                        {reward.description}
                      </p>
                      {isClaimed && (
                        <p className={`text-xs tracking-widest ${isClaimedByMe ? 'text-green-600' : 'text-orange-800'}`}>
                          {isClaimedByMe ? '✓ Ton choix' : `Pris par ${claim!.username}`}
                        </p>
                      )}
                      {canClaim && (
                        <p className="text-xs tracking-[0.2em] text-orange-400 uppercase">
                          → Choisir cette récompense
                        </p>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {currentUserRank === 0 && (
              <p className="text-center text-xs text-orange-800 tracking-widest py-4">
                Tu n'es pas dans le top 6 — mais tu peux suivre les choix en temps réel.
              </p>
            )}
          </>
        )}
      </main>
    </motion.div>

    {/* Modal de confirmation — portal pour éviter le bug de position avec les transforms */}
    {createPortal(
      <AnimatePresence>
        {pendingReward && (
          <motion.div
            className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-terminal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-sm border border-orange-500/60 bg-black/95 p-6 space-y-5"
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div>
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">Confirmer ton choix</p>
                <p className="mt-2 text-sm font-bold tracking-wider uppercase text-orange-200 leading-snug">
                  {pendingReward.name}
                </p>
              </div>
              <p className="text-xs text-orange-700 tracking-wide leading-relaxed">
                Ce choix est définitif et ne peut pas être annulé. Es-tu sûr de vouloir sélectionner cette récompense ?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPendingReward(null)}
                  className="flex-1 border border-orange-500/30 py-2.5 text-xs tracking-[0.25em] text-orange-600 uppercase hover:border-orange-500/60 hover:text-orange-400 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 border border-orange-400/70 bg-orange-500/15 py-2.5 text-xs tracking-[0.25em] text-orange-200 uppercase font-bold hover:bg-orange-500/25 transition-all"
                >
                  Confirmer →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  )
}
