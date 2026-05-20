import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Gift, Trophy, CheckCircle2, Clock, Lock, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { TARGET_DATE } from '../../config/constants'

const REWARDS = [
  {
    id: 1,
    name: 'Chaise de camping',
    description: "Tu as le permis exceptionnel d'emmener une chaise de camping en Croatie (normalement interdit à l'étranger).",
  },
  {
    id: 2,
    name: 'Ticket coupe-file',
    description: "Valable une seule fois, il te permet de passer instantanément premier dans n'importe quelle file.",
  },
  {
    id: 3,
    name: "Intendant privé d'un soir",
    description: "Tu peux engager un intendant pour qu'il cuisine un soir dans ta patrouille. (Pas valable pour CC).",
  },
  {
    id: 4,
    name: 'Petit-déjeuner de luxe',
    description: "Tu te fais livrer ton petit dej. à ton pilo dès ton réveil.",
  },
  {
    id: 5,
    name: 'Apéro de luxe',
    description: "Tu reçois boisson et snack directement sur la plaine pour te faire un petit apéro trkl.",
  },
]

interface LeaderEntry {
  username: string
  total_points: number
  discoveries_count: number
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
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [claims, setClaims] = useState<RewardClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)

  const fetchData = useCallback(async () => {
    const [leadRes, claimRes, hiddenRes] = await Promise.all([
      supabase.from('leaderboard').select('username, total_points, discoveries_count').order('total_points', { ascending: false }),
      supabase.from('reward_claims').select('*').order('claimed_at', { ascending: true }),
      supabase.from('hidden_users').select('username'),
    ])
    const hidden = ((hiddenRes.data ?? []) as { username: string }[]).map(r => r.username)
    const allLeaders = (leadRes.data ?? []) as LeaderEntry[]
    setLeaders(allLeaders.filter(l => !hidden.includes(l.username.toLowerCase())))
    setClaims((claimRes.data ?? []) as RewardClaim[])
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
  const top5 = leaders.slice(0, 5)
  const currentUserRank = top5.findIndex(
    l => l.username.toLowerCase() === currentUsername.toLowerCase()
  ) + 1
  const myClaim = claims.find(c => c.username.toLowerCase() === currentUsername.toLowerCase())
  const currentTurn = claims.length + 1
  const isMyTurn = missionComplete && currentUserRank > 0 && currentUserRank === currentTurn && !myClaim

  const handleClaim = async (rewardId: number) => {
    if (!isMyTurn || claiming) return
    if (claims.find(c => c.reward_id === rewardId)) return
    setClaiming(true)
    const { error } = await supabase.from('reward_claims').insert([{
      username: currentUsername,
      reward_id: rewardId,
      rank: currentUserRank,
    }])
    if (!error) await fetchData()
    setClaiming(false)
  }

  return (
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
                  ? "Le top 5 choisit ses récompenses dans l'ordre du classement final."
                  : "Les choix seront débloqués à la fin du compte à rebours. Voici un aperçu des récompenses."}
              </p>
            </div>

            {/* Top 5 */}
            <div className="border border-orange-500/30 bg-black/60 p-5 space-y-3">
              <div className="flex items-center gap-2 border-b border-orange-500/20 pb-3">
                <Trophy className="h-3.5 w-3.5 text-orange-600" />
                <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">Classement Final — Top 5</p>
              </div>
              {top5.length === 0 ? (
                <p className="text-xs text-orange-700 py-4 text-center">Aucun scout inscrit.</p>
              ) : (
                <div className="space-y-2">
                  {top5.map((entry, i) => {
                    const rank = i + 1
                    const claim = claims.find(c => c.username.toLowerCase() === entry.username.toLowerCase())
                    const isCurrentTurnPlayer = rank === currentTurn && !claim
                    const isMe = entry.username.toLowerCase() === currentUsername.toLowerCase()
                    const chosenReward = claim ? REWARDS.find(r => r.id === claim.reward_id) : null
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
                        <span className="text-xs text-orange-700 tracking-widest flex-shrink-0">{entry.total_points} pts</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

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
                      Tu es dans le top 5 — choix disponible à la fin du compte à rebours
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
                      onClick={() => canClaim && handleClaim(reward.id)}
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
                Tu n'es pas dans le top 5 — mais tu peux suivre les choix en temps réel.
              </p>
            )}
          </>
        )}
      </main>
    </motion.div>
  )
}
