import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy, Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const EGGS = [
  {
    id: 'override_reussi',
    label: 'Faille #01',
    name: 'Le Code Secret du Compte à Rebours',
    description: 'Trouver la combinaison exacte à 4 chiffres pour forcer l\'accès au bouton de téléchargement des documents secrets.',
    points: 10,
  },
  {
    id: 'etat_du_bus',
    label: 'Faille #02',
    name: 'La Photo du Bus du Camp',
    description: 'Débloquer l\'accès visuel pour découvrir en exclusivité l\'état et l\'ambiance du bus qui nous emmènera en Croatie.',
    points: 9,
  },
  {
    id: 'konami_hymne',
    label: 'Faille #03',
    name: 'Le Nouvel Hymne de la Troupe',
    description: 'Réussir à intercepter le fichier audio pour écouter en avant-première le tout nouvel hymne officiel de la troupe.',
    points: 8,
  },
  {
    id: 'rappeur_obi_wan',
    label: 'Faille #04',
    name: 'Le Rappeur Préféré d\'Obi-Wan Kenobi',
    description: 'Trouver la photo du rappeur préféré de chef Obi-Wan Kenobi.',
    points: 7,
  },
  {
    id: 'peace_sign',
    label: 'Faille #05',
    name: 'La Date et l\'Heure du Départ',
    description: 'Découvrir le jour J et l\'heure exacte du rendez-vous pour le grand départ en camp.',
    points: 6,
  },
  {
    id: 'gorilles_croates',
    label: 'Faille #06',
    name: 'Les Gorilles en Croatie',
    description: 'Découvrir la photo des fameux gorilles Croates, hautement imprévisibles et dangereux sur place.',
    points: 5,
  },
  {
    id: 'organigramme_aurora',
    label: 'Faille #07',
    name: 'L\'Organigramme d\'AURORA CORP',
    description: 'Découvrir l\'organigramme secret et la composition de la AURORA CORP.',
    points: 4,
  },
  {
    id: 'audio_frequences',
    label: 'Faille #08',
    name: 'La Nouvelle Musique de Tibo InShape',
    description: 'Pirater le lecteur pour écouter en avant-première la toute nouvelle production musicale du premier youtubeur de France.',
    points: 4,
  },
]

const TOTAL_POINTS = EGGS.reduce((s, e) => s + e.points, 0)

interface LeaderEntry {
  username: string
  total_points: number
  discoveries_count: number
  first_discovery_at: string | null
}

interface DiscoveryEntry {
  username: string
  discovered_at: string
}

interface MyQuest {
  easter_egg_id: string
  discovered_at: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-BE', {
    timeZone: 'Europe/Brussels',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
}

export function LeaderboardPage({ onBack, currentUsername }: { onBack: () => void; currentUsername: string }) {
  const [tab, setTab] = useState<'quests' | 'ranking' | 'walloffame'>('quests')

  // Classement
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hiddenUsers, setHiddenUsers] = useState<string[]>([])

  // Wall of fame
  const [discoveries, setDiscoveries] = useState<DiscoveryEntry[]>([])
  const [selectedEgg, setSelectedEgg] = useState(EGGS[0].id)
  const [wallLoading, setWallLoading] = useState(false)

  // Mes failles
  const [myQuests, setMyQuests] = useState<MyQuest[]>([])
  const [questsLoading, setQuestsLoading] = useState(false)
  const [expandedEgg, setExpandedEgg] = useState<string | null>(null)

  const fetchLeaders = useCallback(async () => {
    setLoading(true)
    const [leadRes, hiddenRes] = await Promise.all([
      supabase.from('leaderboard').select('*').order('total_points', { ascending: false }).order('last_discovery_at', { ascending: true }),
      supabase.from('hidden_users').select('username'),
    ])
    const hidden = ((hiddenRes.data ?? []) as { username: string }[]).map(r => r.username)
    setHiddenUsers(hidden)
    setLeaders((leadRes.data ?? []) as LeaderEntry[])
    setLoading(false)
  }, [])

  const fetchDiscoveries = useCallback(async (eggId: string) => {
    setWallLoading(true)
    const { data } = await supabase
      .from('easter_egg_discoveries')
      .select('username, discovered_at')
      .eq('easter_egg_id', eggId)
      .order('discovered_at', { ascending: true })
    setDiscoveries((data ?? []) as DiscoveryEntry[])
    setWallLoading(false)
  }, [])

  const fetchMyQuests = useCallback(async () => {
    setQuestsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setQuestsLoading(false); return }
    const { data } = await supabase
      .from('user_discoveries')
      .select('easter_egg_id, discovered_at')
      .eq('auth_id', user.id)
    setMyQuests((data ?? []) as MyQuest[])
    setQuestsLoading(false)
  }, [])

  useEffect(() => { fetchLeaders() }, [fetchLeaders])

  useEffect(() => {
    if (tab === 'walloffame') fetchDiscoveries(selectedEgg)
  }, [tab, selectedEgg, fetchDiscoveries])

  useEffect(() => {
    if (tab === 'quests') fetchMyQuests()
  }, [tab, fetchMyQuests])

  useEffect(() => {
    const channel = supabase
      .channel('leaderboard_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_discoveries' }, () => {
        fetchLeaders()
        if (tab === 'walloffame') fetchDiscoveries(selectedEgg)
        if (tab === 'quests') fetchMyQuests()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [tab, selectedEgg, fetchLeaders, fetchDiscoveries, fetchMyQuests])

  const visibleLeaders = leaders.filter(l => !hiddenUsers.includes(l.username.toLowerCase()))
  const visibleDiscoveries = discoveries.filter(d => !hiddenUsers.includes(d.username.toLowerCase()))

  const foundIds = new Set(myQuests.map(q => q.easter_egg_id))
  const myPoints = myQuests.reduce((s, q) => {
    const egg = EGGS.find(e => e.id === q.easter_egg_id)
    return s + (egg?.points ?? 0)
  }, 0)

  const TABS = [
    { id: 'quests',    label: 'Mes Failles'          },
    { id: 'ranking',   label: 'Classement'           },
    { id: 'walloffame', label: 'Wall of Fame'        },
  ] as const

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
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs tracking-widest text-orange-600 hover:text-orange-400 transition-colors uppercase"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour
          </button>
          <div className="flex items-center gap-2 ml-2">
            <Trophy className="h-4 w-4 text-orange-500" />
            <span className="text-xs tracking-[0.3em] text-orange-400 uppercase font-bold">Classement A.U.R.O.R.A</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="sticky top-[45px] z-20 border-b border-orange-500/60 bg-black/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-0 whitespace-nowrap py-3.5 text-xs tracking-widest uppercase border-b-2 transition-all duration-300 ${
                tab === t.id
                  ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                  : 'border-transparent text-orange-600 hover:text-orange-400 hover:bg-orange-500/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <AnimatePresence mode="wait">

          {/* ── Mes Failles ── */}
          {tab === 'quests' && (
            <motion.div
              key="quests"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="border border-orange-500/50 bg-black/60 backdrop-blur-sm p-5 sm:p-7 space-y-5"
            >
              {/* Score recap */}
              <div className="flex items-center justify-between border-b border-orange-500/20 pb-4">
                <div>
                  <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">Failles découvertes — {currentUsername}</p>
                  <p className="mt-1 text-lg font-bold text-orange-300 tracking-wider">
                    {myPoints} <span className="text-orange-600 text-sm font-normal">/ {TOTAL_POINTS} pts</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-orange-700 tracking-widest">
                    {foundIds.size} / {EGGS.length} failles trouvées
                  </p>
                  <div className="mt-1.5 flex gap-1 justify-end">
                    {EGGS.map(e => (
                      <div
                        key={e.id}
                        className={`h-1.5 w-4 rounded-sm ${foundIds.has(e.id) ? 'bg-orange-500' : 'bg-orange-900/60'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Egg list */}
              {questsLoading ? (
                <p className="text-xs text-orange-600 tracking-widest py-6 text-center animate-pulse">Chargement...</p>
              ) : (
                <div className="space-y-2">
                  {EGGS.map((egg, i) => {
                    const found = foundIds.has(egg.id)
                    const quest = myQuests.find(q => q.easter_egg_id === egg.id)
                    const expanded = expandedEgg === egg.id
                    return (
                      <motion.div
                        key={egg.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className={`border transition-all ${
                          found
                            ? 'border-orange-400/50 bg-orange-900/10'
                            : 'border-orange-500/15 bg-black/30'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedEgg(expanded ? null : egg.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          {found
                            ? <CheckCircle2 className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            : <Lock className="h-4 w-4 text-orange-800 flex-shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs tracking-[0.2em] uppercase mb-0.5 ${found ? 'text-orange-600' : 'text-orange-800'}`}>
                              {egg.label}
                            </p>
                            <p className={`text-sm tracking-wider uppercase font-bold ${found ? 'text-orange-200' : 'text-orange-700'}`}>
                              {egg.name}
                            </p>
                            {found && quest && (
                              <p className="text-xs tracking-widest mt-0.5 text-orange-600">
                                Découverte le {fmtDate(quest.discovered_at)}
                              </p>
                            )}
                          </div>
                          <span className={`text-sm font-bold tracking-wider flex-shrink-0 ${found ? 'text-orange-400' : 'text-orange-900'}`}>
                            +{egg.points}
                          </span>
                          {expanded
                            ? <ChevronUp className="h-3.5 w-3.5 text-orange-600 flex-shrink-0 ml-1" />
                            : <ChevronDown className="h-3.5 w-3.5 text-orange-700 flex-shrink-0 ml-1" />
                          }
                        </button>

                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 border-t border-orange-500/15">
                                <p className={`text-xs leading-relaxed tracking-wide ${found ? 'text-orange-400' : 'text-orange-700'}`}>
                                  {egg.description}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Classement Général ── */}
          {tab === 'ranking' && (
            <motion.div
              key="ranking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="border border-orange-500/50 bg-black/60 backdrop-blur-sm p-5 sm:p-7 space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-orange-500/20 pb-4">
                <Trophy className="h-3.5 w-3.5 text-orange-600" />
                <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">Points cumulés — Failles découvertes</p>
              </div>

              {loading ? (
                <p className="text-xs text-orange-600 tracking-widest py-8 text-center animate-pulse">Chargement...</p>
              ) : visibleLeaders.length === 0 ? (
                <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucun scout inscrit.</p>
              ) : (
                <div className="space-y-2">
                  {visibleLeaders.map((entry, i) => {
                    const isMe = entry.username.toLowerCase() === currentUsername.toLowerCase()
                    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
                    return (
                      <motion.div
                        key={entry.username}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className={`flex items-center gap-3 px-4 py-3 border transition-all ${
                          isMe
                            ? 'border-orange-400/60 bg-orange-500/10'
                            : 'border-orange-500/20 bg-black/40 hover:bg-orange-500/5'
                        }`}
                      >
                        <span className="w-7 text-center flex-shrink-0 text-sm">
                          {typeof rank === 'string' && rank.startsWith('#')
                            ? <span className="text-xs text-orange-700 font-terminal">{rank}</span>
                            : rank
                          }
                        </span>
                        <span className={`flex-1 text-sm tracking-wider uppercase font-bold ${isMe ? 'text-orange-300' : 'text-orange-200'}`}>
                          {entry.username}
                          {isMe && <span className="ml-2 text-xs text-orange-500 normal-case tracking-widest font-normal">(toi)</span>}
                        </span>
                        <span className="text-xs text-orange-700 tracking-widest hidden sm:block flex-shrink-0">
                          {entry.discoveries_count} faille{entry.discoveries_count !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-sm font-bold tracking-wider flex-shrink-0 ${
                          i === 0 ? 'text-yellow-400' : i === 1 ? 'text-orange-300' : i === 2 ? 'text-orange-400' : 'text-orange-600'
                        }`}>
                          {entry.total_points} pts
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Wall of Fame ── */}
          {tab === 'walloffame' && (
            <motion.div
              key="walloffame"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="border border-orange-500/50 bg-black/60 backdrop-blur-sm p-5 sm:p-7 space-y-5"
            >
              <div className="flex flex-wrap gap-2">
                {EGGS.map(egg => (
                  <button
                    key={egg.id}
                    onClick={() => setSelectedEgg(egg.id)}
                    className={`px-3 py-1.5 text-xs tracking-[0.15em] uppercase border transition-all duration-200 ${
                      selectedEgg === egg.id
                        ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                        : 'border-orange-500/25 text-orange-700 hover:border-orange-500/50 hover:text-orange-500'
                    }`}
                  >
                    {egg.label}
                    <span className="ml-1.5 text-orange-600 font-normal">+{egg.points}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-orange-500/20 pt-5 space-y-3">
                {(() => { const e = EGGS.find(x => x.id === selectedEgg); return e ? (
                  <div>
                    <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">
                      &gt; {e.label} — {e.name}
                    </p>
                    <p className="text-xs text-orange-800 mt-1 leading-relaxed">{e.description}</p>
                  </div>
                ) : null })()}

                {wallLoading ? (
                  <p className="text-xs text-orange-600 tracking-widest py-6 text-center animate-pulse">Chargement...</p>
                ) : visibleDiscoveries.length === 0 ? (
                  <p className="text-xs text-orange-800 tracking-widest py-6 text-center">
                    Personne n'a encore découvert cette faille.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {visibleDiscoveries.map((d, i) => {
                      const isMe = d.username.toLowerCase() === currentUsername.toLowerCase()
                      return (
                        <motion.div
                          key={`${d.username}-${i}`}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.2 }}
                          className={`flex items-center justify-between px-4 py-2.5 border ${
                            isMe
                              ? 'border-orange-400/60 bg-orange-500/10'
                              : i === 0
                              ? 'border-yellow-500/30 bg-yellow-900/10'
                              : 'border-orange-500/15 bg-black/30'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-center flex-shrink-0 text-sm">
                              {i === 0 ? '🥇' : <span className="text-xs text-orange-700">#{i + 1}</span>}
                            </span>
                            <span className={`text-sm tracking-wider uppercase font-bold ${
                              isMe ? 'text-orange-300' : i === 0 ? 'text-yellow-300' : 'text-orange-200'
                            }`}>
                              {d.username}
                              {isMe && <span className="ml-2 text-xs text-orange-500 normal-case tracking-widest font-normal">(toi)</span>}
                            </span>
                          </div>
                          <span className="text-xs text-orange-700 tracking-widest flex-shrink-0">
                            {fmtDate(d.discovered_at)}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </motion.div>
  )
}
