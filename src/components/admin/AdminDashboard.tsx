import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X, RefreshCw, Users, Search, KeyRound, AlertTriangle,
  BarChart3, Loader2, ChevronRight, Trophy, Zap, Target, EyeOff, Eye,
  ArrowUp, ArrowDown, Plus, Trash2, Save, CheckCircle2,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import {
  DNA_SCAN_TABLE, PUNISHMENT_TABLE, FAILED_OVERRIDE_TABLE, HAND_PICK_TABLE, CONNECTION_LOG_TABLE,
} from '../../config/constants'

// ─── Easter eggs catalog ──────────────────────────────────────────────────────

const EGGS = [
  { id: 'override_reussi',     name: 'Code Rebours',    points: 10 },
  { id: 'etat_du_bus',         name: 'Bus du Camp',     points: 9  },
  { id: 'konami_hymne',        name: 'Hymne Troupe',    points: 8  },
  { id: 'rappeur_obi_wan',     name: 'Rappeur Obi-Wan', points: 7  },
  { id: 'peace_sign',          name: 'Heure du Départ', points: 6  },
  { id: 'gorilles_croates',    name: 'Gorilles',        points: 5  },
  { id: 'organigramme_aurora', name: 'Organigramme',    points: 4  },
  { id: 'audio_frequences',    name: 'Tibo InShape',    points: 4  },
]
const TOTAL_POINTS = EGGS.reduce((s, e) => s + e.points, 0)

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string; username: string; age: number
  created_at: string; ip: string | null; city: string | null
}
interface UserDiscovery {
  id: string; auth_id: string; easter_egg_id: string; discovered_at: string
}
interface EggDiscovery {
  easter_egg_id: string; easter_egg_name: string; username: string; discovered_at: string; points: number
}
interface LeaderEntry {
  username: string; total_points: number; discoveries_count: number; first_discovery_at: string | null
}
interface DnaScan {
  id: number; logged_as: string; scanned_id: string
  created_at: string; ip: string | null; city: string | null
}
interface PunishmentLog {
  id: number; prenom_totem: string; age: number | null
  punishment_number: number; bypassed: boolean; rating: number | null
  comment: string | null; punished_at: string; ip: string | null; city: string | null
}
interface FailedLog {
  id: number; prenom_totem: string; age: number | null
  failed_at: string; ip: string | null; city: string | null; code_tried: string | null
}
interface HandPickLog {
  id: number; prenom_totem: string; emoji: string; correct: boolean
  ip: string | null; city: string | null; created_at: string
}
interface ConnectionLog {
  id: string; username: string; ip: string | null; city: string | null; connected_at: string
}
interface GameRating {
  id: number; username: string; rating: number; comment: string; created_at: string
}

// ─── Faction helpers ──────────────────────────────────────────────────────────

const MEMBER_FACTIONS: [string, string][] = [
  ['Asio','Coexistants'],['Douc','Coexistants'],['Azandica','Coexistants'],
  ['Springbok','Coexistants'],['Warrah','Coexistants'],['Vanneau','Coexistants'],
  ['Simon','Coexistants'],['Dario','Coexistants'],
  ['Irbis','Conquérants'],['Wipsy','Conquérants'],['Mangabey','Conquérants'],
  ['Cariacou','Conquérants'],['Juno','Conquérants'],['Hermine','Conquérants'],
  ['Léon','Conquérants'],['Camille','Conquérants'],
  ['Entelle','Croyants'],['Musang','Croyants'],['Ondatra','Croyants'],
  ['Nayaur','Croyants'],['Folivora','Croyants'],['Kangal','Croyants'],
  ['Raphaël','Croyants'],['Michael','Croyants'],
  ['Oryx','Évadés'],['Sapajou','Évadés'],['Brocard','Évadés'],
  ['Ashera','Évadés'],['Wombat','Évadés'],['Saguinus','Évadés'],['Alexis','Évadés'],
  ['Ourebi','Bâtisseurs'],['Ailurus','Bâtisseurs'],['Gecko','Bâtisseurs'],
  ['Simensis','Bâtisseurs'],['Caracal','Bâtisseurs'],['Harfang','Bâtisseurs'],
  ['Jack','Bâtisseurs'],['Nicolas','Bâtisseurs'],
  ['Mazama','Explorateurs'],['Mustela','Explorateurs'],['Linsang','Explorateurs'],
  ['Dhole','Explorateurs'],['Hydrurga','Explorateurs'],['Caberu','Explorateurs'],
  ['Jules','Explorateurs'],['Achille','Explorateurs'],
  ['Serval','Survivants'],['Tangara','Survivants'],['Siamang','Survivants'],
  ['Galago','Survivants'],['Chaoui','Survivants'],['Zarafa','Survivants'],
  ['Capucin','Survivants'],['Florent','Survivants'],
]
const FACTION_COLORS: Record<string, string> = {
  'Évadés':'#f97316','Conquérants':'#ef4444','Coexistants':'#22c55e',
  'Bâtisseurs':'#eab308','Explorateurs':'#3b82f6','Croyants':'#a855f7',
  'Survivants':'#14b8a6','Inconnu':'#6b7280',
}
function normalizeName(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
function findFaction(id: string): string {
  const n = normalizeName(id)
  for (const [name, faction] of MEMBER_FACTIONS) {
    if (n.includes(normalizeName(name))) return faction
  }
  return 'Inconnu'
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  primary: '#f97316',
  grid: 'rgba(249,115,22,0.12)',
  axis: '#7c3d12',
  muted: 'rgba(249,115,22,0.15)',
}

// ─── Brussels timezone helpers ────────────────────────────────────────────────

function getBrusselsParts(iso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(iso))
  const p: Record<string, string> = {}
  for (const part of parts) p[part.type] = part.value
  return p
}

function fmtBrussels(iso: string): string {
  return new Date(iso).toLocaleString('fr-BE', {
    timeZone: 'Europe/Brussels',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

// ─── Chart data builders ──────────────────────────────────────────────────────

type Granularity = 'day' | 'hour' | 'minute'

function buildTimeData(items: { created_at: string }[], granularity: Granularity) {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const p = getBrusselsParts(item.created_at)
    const key = granularity === 'day'
      ? `${p.year}-${p.month}-${p.day}`
      : granularity === 'hour'
      ? `${p.year}-${p.month}-${p.day}T${p.hour}`
      : `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
    counts[key] = (counts[key] || 0) + 1
  }
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      let label = key
      if (granularity === 'day') {
        const [, m, d] = key.split('-')
        label = `${d}/${m}`
      } else if (granularity === 'hour') {
        const [date, h] = key.split('T')
        const [, m, d] = date.split('-')
        label = `${d}/${m} ${h}h`
      } else {
        label = key.split('T')[1]?.slice(0, 5) ?? key.slice(11)
      }
      return { time: label, count }
    })
}

function buildTopWords(scans: DnaScan[], limit = 12) {
  const map: Record<string, { display: string; count: number }> = {}
  for (const s of scans) {
    const raw = s.scanned_id.trim()
    const lower = raw.toLowerCase()
    if (!map[lower]) map[lower] = { display: raw, count: 0 }
    map[lower].count++
  }
  return Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ display, count }) => ({ word: display, count }))
}

function buildFactionData(scans: DnaScan[]) {
  const counts: Record<string, number> = {}
  for (const s of scans) {
    const f = findFaction(s.scanned_id)
    counts[f] = (counts[f] || 0) + 1
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([faction, count]) => ({ faction, count, fill: FACTION_COLORS[faction] ?? '#6b7280' }))
}

function buildEggProgress(discoveries: UserDiscovery[], totalPlayers: number) {
  return EGGS.map(egg => ({
    name: egg.name,
    count: discoveries.filter(d => d.easter_egg_id === egg.id).length,
    total: totalPlayers,
    points: egg.points,
  }))
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function AuroraTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-orange-500/50 bg-black/95 px-3 py-2 font-terminal text-xs">
      {label && <p className="text-orange-500 tracking-wider mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>{entry.name}: <span className="font-bold">{entry.value}</span></p>
      ))}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, label, children }: { title: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-orange-500/20 pb-2">
        <ChevronRight className="h-3.5 w-3.5 text-orange-600" />
        <div>
          <p className="text-xs tracking-[0.25em] text-orange-600 uppercase">{label}</p>
          <p className="text-sm tracking-widest text-orange-300 uppercase font-bold">{title}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className={`border p-4 space-y-2 ${accent ? 'border-orange-400/60 bg-orange-900/10' : 'border-orange-500/30 bg-black/60'}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${accent ? 'text-orange-400' : 'text-orange-600'}`} />
        <p className="text-xs tracking-[0.2em] text-orange-600 uppercase">{label}</p>
      </div>
      <p className={`text-2xl font-bold tracking-wider ${accent ? 'text-orange-300' : 'text-orange-400'}`}>{value}</p>
      {sub && <p className="text-xs text-orange-700 tracking-wider">{sub}</p>}
    </div>
  )
}

// ─── Raw table ────────────────────────────────────────────────────────────────

function RawTable({ columns, rows }: { columns: string[]; rows: (string | number | boolean | null)[][] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-orange-700 tracking-widest py-4 text-center">Aucune donnée</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-terminal border-collapse">
        <thead>
          <tr className="border-b border-orange-500/30">
            {columns.map(c => (
              <th key={c} className="text-left py-2 px-3 text-orange-600 tracking-widest uppercase whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-orange-500/10 hover:bg-orange-500/5 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 px-3 text-orange-200 whitespace-nowrap max-w-[200px] truncate">
                  {cell === null || cell === undefined
                    ? <span className="text-orange-800">—</span>
                    : typeof cell === 'boolean'
                    ? <span className={cell ? 'text-green-500' : 'text-red-500'}>{cell ? 'Oui' : 'Non'}</span>
                    : String(cell)
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true)
  const [granularity, setGranularity] = useState<Granularity>('day')
  const [rawTab, setRawTab] = useState(0)
  const [page, setPage] = useState(0)
  const [overrideCode, setOverrideCode] = useState<string | null>(null)
  const PAGE_SIZE = 50

  const [users, setUsers] = useState<User[]>([])
  const [discoveries, setDiscoveries] = useState<UserDiscovery[]>([])
  const [eggDiscoveries, setEggDiscoveries] = useState<EggDiscovery[]>([])
  const [leaders, setLeaders] = useState<LeaderEntry[]>([])
  const [dnaScans, setDnaScans] = useState<DnaScan[]>([])
  const [punishments, setPunishments] = useState<PunishmentLog[]>([])
  const [failedLogs, setFailedLogs] = useState<FailedLog[]>([])
  const [handPicks, setHandPicks] = useState<HandPickLog[]>([])
  const [connections, setConnections] = useState<ConnectionLog[]>([])
  const [hiddenUsers, setHiddenUsers] = useState<string[]>([])
  const [ratings, setRatings] = useState<GameRating[]>([])
  const [manualRanking, setManualRanking] = useState<string[]>([])
  const [manualRankingSaved, setManualRankingSaved] = useState(false)
  const [manualRankingSaving, setManualRankingSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [u, disc, eggDisc, lead, dna, pun, fail, hand, conn, codeRes, hiddenRes, rankRes, ratingsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('user_discoveries').select('*').order('discovered_at', { ascending: false }),
      supabase.from('easter_egg_discoveries').select('*').order('discovered_at', { ascending: false }),
      supabase.from('leaderboard').select('*'),
      supabase.from(DNA_SCAN_TABLE).select('*').order('created_at', { ascending: false }),
      supabase.from(PUNISHMENT_TABLE).select('*').order('punished_at', { ascending: false }),
      supabase.from(FAILED_OVERRIDE_TABLE).select('*').order('failed_at', { ascending: false }),
      supabase.from(HAND_PICK_TABLE).select('*').order('created_at', { ascending: false }),
      supabase.from(CONNECTION_LOG_TABLE).select('*').order('connected_at', { ascending: false }),
      supabase.from('admin_config').select('value').eq('key', 'first_code').single(),
      supabase.from('hidden_users').select('username'),
      supabase.from('admin_config').select('value').eq('key', 'manual_ranking').maybeSingle(),
      supabase.from('game_ratings').select('*').order('created_at', { ascending: false }),
    ])
    setUsers((u.data ?? []) as User[])
    setDiscoveries((disc.data ?? []) as UserDiscovery[])
    setEggDiscoveries((eggDisc.data ?? []) as EggDiscovery[])
    setLeaders((lead.data ?? []) as LeaderEntry[])
    setDnaScans((dna.data ?? []) as DnaScan[])
    setPunishments((pun.data ?? []) as PunishmentLog[])
    setFailedLogs((fail.data ?? []) as FailedLog[])
    setHandPicks((hand.data ?? []) as HandPickLog[])
    setConnections((conn.data ?? []) as ConnectionLog[])
    setOverrideCode((codeRes.data as { value: string } | null)?.value ?? null)
    setHiddenUsers(((hiddenRes.data ?? []) as { username: string }[]).map(r => r.username))
    const rankData = rankRes.data as { value: string } | null
    if (rankData?.value) {
      try {
        const parsed = JSON.parse(rankData.value)
        setManualRanking(Array.isArray(parsed) ? parsed : [])
      } catch { setManualRanking([]) }
    }
    setRatings((ratingsRes.data ?? []) as GameRating[])
    setLoading(false)
  }, [])

  const toggleHideUser = async (username: string) => {
    const lower = username.toLowerCase()
    if (hiddenUsers.includes(lower)) {
      await supabase.from('hidden_users').delete().eq('username', lower)
      setHiddenUsers(prev => prev.filter(u => u !== lower))
    } else {
      await supabase.from('hidden_users').insert({ username: lower })
      setHiddenUsers(prev => [...prev, lower])
    }
  }

  const addToManualRanking = (username: string) => {
    if (manualRanking.length >= 6) return
    if (manualRanking.includes(username)) return
    setManualRanking(prev => [...prev, username])
    setManualRankingSaved(false)
  }

  const removeFromManualRanking = (username: string) => {
    setManualRanking(prev => prev.filter(u => u !== username))
    setManualRankingSaved(false)
  }

  const moveManualRanking = (index: number, dir: -1 | 1) => {
    const newList = [...manualRanking]
    const target = index + dir
    if (target < 0 || target >= newList.length) return
    ;[newList[index], newList[target]] = [newList[target], newList[index]]
    setManualRanking(newList)
    setManualRankingSaved(false)
  }

  const saveManualRanking = async () => {
    setManualRankingSaving(true)
    const value = JSON.stringify(manualRanking)
    const { data: existing } = await supabase
      .from('admin_config')
      .select('key')
      .eq('key', 'manual_ranking')
      .maybeSingle()
    if (existing) {
      await supabase.from('admin_config').update({ value }).eq('key', 'manual_ranking')
    } else {
      await supabase.from('admin_config').insert({ key: 'manual_ranking', value })
    }
    setManualRankingSaving(false)
    setManualRankingSaved(true)
    setTimeout(() => setManualRankingSaved(false), 3000)
  }

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── KPI computations ──
  const totalPlayers = users.length
  const totalDiscoveries = discoveries.length
  const leader = leaders[0]
  const eggProgress = buildEggProgress(discoveries, totalPlayers)
  const mostFound = [...eggProgress].sort((a, b) => b.count - a.count)[0]
  const leastFound = [...eggProgress].filter(e => e.count > 0).sort((a, b) => a.count - b.count)[0]
  const totalScans = dnaScans.length
  const totalFailed = failedLogs.length
  const peaceTotal = handPicks.length
  const peaceSuccess = handPicks.filter(h => h.correct).length
  const peacePct = peaceTotal > 0 ? Math.round(peaceSuccess / peaceTotal * 100) : 0
  const bypassed = punishments.filter(p => p.bypassed).length
  const todayUsers = users.filter(u => {
    const p = getBrusselsParts(u.created_at)
    const t = getBrusselsParts(new Date().toISOString())
    return p.year === t.year && p.month === t.month && p.day === t.day
  }).length
  const todayConnections = connections.filter(c => {
    const p = getBrusselsParts(c.connected_at)
    const t = getBrusselsParts(new Date().toISOString())
    return p.year === t.year && p.month === t.month && p.day === t.day
  }).length

  // ── Chart data ──
  const registrationsData = buildTimeData([...users].reverse(), granularity)
  const connectionsData = buildTimeData(
    [...connections].reverse().map(c => ({ created_at: c.connected_at })),
    granularity
  )
  const topWordsData = buildTopWords(dnaScans)
  const factionData = buildFactionData(dnaScans)

  // ── Raw table tabs ──
  const RAW_TABS = ['Joueurs', 'Connexions', 'Failles', 'Scans', 'Overrides', 'Punitions', 'Peace Sign']
  const RAW_COLUMNS = [
    ['Pseudo', 'Âge', 'Ville', 'IP', 'Inscription'],
    ['Pseudo', 'Ville', 'IP', 'Date connexion'],
    ['Joueur', 'Faille', 'Points', 'Date'],
    ['Scanné', 'Par', 'Ville', 'IP', 'Date'],
    ['Pseudo', 'Âge', 'Code tenté', 'Ville', 'IP', 'Date'],
    ['Pseudo', 'Punition #', 'Bypassé', 'Note', 'Commentaire', 'Date'],
    ['Pseudo', 'Emoji', 'Correct', 'Ville', 'IP', 'Date'],
  ]
  const allRawRows = (tab: number): (string | number | boolean | null)[][] => {
    switch (tab) {
      case 0: return users.map(u => [u.username, u.age, u.city, u.ip, fmtBrussels(u.created_at)])
      case 1: return connections.map(c => [c.username, c.city, c.ip, fmtBrussels(c.connected_at)])
      case 2: return eggDiscoveries.map(d => [d.username, d.easter_egg_name, d.points, fmtBrussels(d.discovered_at)])
      case 3: return dnaScans.map(d => [d.scanned_id, d.logged_as, d.city, d.ip, fmtBrussels(d.created_at)])
      case 4: return failedLogs.map(f => [f.prenom_totem, f.age, f.code_tried, f.city, f.ip, fmtBrussels(f.failed_at)])
      case 5: return punishments.map(p => [p.prenom_totem, p.punishment_number, p.bypassed, p.rating, p.comment, fmtBrussels(p.punished_at)])
      case 6: return handPicks.map(h => [h.prenom_totem, h.emoji, h.correct, h.city, h.ip, fmtBrussels(h.created_at)])
      default: return []
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-black font-terminal text-orange-100 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 scanlines opacity-10 z-10" />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-orange-500/50 bg-black/95 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 blink" />
          <div>
            <p className="text-xs tracking-[0.3em] text-orange-600 uppercase">Accès Administrateur</p>
            <h1 className="text-sm tracking-widest text-orange-300 uppercase font-bold">
              Rapport Opérationnel — A.U.R.O.R.A CORP
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {overrideCode && (
            <div className="flex items-center gap-2 border border-orange-500/30 bg-orange-500/5 px-3 py-1.5">
              <span className="text-xs tracking-[0.2em] text-orange-700 uppercase">Code override</span>
              <span className="text-sm font-bold tracking-[0.4em] text-orange-300 font-terminal">{overrideCode}</span>
              <span className="text-xs text-orange-800">/ h</span>
            </div>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-1.5 border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs tracking-[0.2em] text-orange-400 uppercase hover:bg-orange-500/20 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button onClick={onClose} className="text-orange-700 hover:text-orange-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="text-xs text-orange-500 tracking-widest">Chargement des données...</p>
          </div>
        ) : (
          <>
            {/* ── KPIs ── */}
            <Section label="Vue d'ensemble" title="Métriques Clés">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <KpiCard icon={Users} label="Scouts inscrits" value={totalPlayers}
                  sub={`${todayUsers} inscription${todayUsers > 1 ? 's' : ''} aujourd'hui`} />
                <KpiCard icon={Users} label="Connexions" value={connections.length}
                  sub={`${todayConnections} aujourd'hui`} />
                <KpiCard icon={Zap} label="Failles découvertes" value={totalDiscoveries}
                  sub={`sur ${EGGS.length * totalPlayers} possibles`} accent />
                <KpiCard icon={Trophy} label="Leader" value={leader?.username ?? '—'}
                  sub={leader ? `${leader.total_points} pts — ${leader.discoveries_count} faille${leader.discoveries_count > 1 ? 's' : ''}` : undefined}
                  accent={!!leader} />
                <KpiCard icon={Target} label="Faille la + trouvée" value={mostFound?.name ?? '—'}
                  sub={mostFound ? `${mostFound.count} / ${totalPlayers} scouts` : undefined} />
                <KpiCard icon={Target} label="Faille la - trouvée" value={leastFound?.name ?? 'Aucune'}
                  sub={leastFound ? `${leastFound.count} / ${totalPlayers} scouts` : 'Encore zéro trouvée'} />
                <KpiCard icon={Search} label="Scans effectués" value={totalScans} />
                <KpiCard icon={KeyRound} label="Override échoués" value={totalFailed} />
                <KpiCard icon={BarChart3} label="Peace sign réussi" value={`${peacePct}%`}
                  sub={`${peaceSuccess} / ${peaceTotal} tentative${peaceTotal > 1 ? 's' : ''}`} />
                <KpiCard icon={AlertTriangle} label="Punitions subies" value={punishments.length - bypassed}
                  sub={`${bypassed} skippée${bypassed > 1 ? 's' : ''} sur ${punishments.length}`} />
              </div>
            </Section>

            {/* ── Classement live ── */}
            <Section label="Classement" title="Top Scouts — Points en temps réel">
              {leaders.length === 0 ? (
                <p className="text-xs text-orange-700 tracking-widest py-4 text-center">Aucun scout inscrit.</p>
              ) : (
                <div className="space-y-2">
                  {leaders.slice(0, 10).map((entry, i) => {
                    const pct = TOTAL_POINTS > 0 ? (entry.total_points / TOTAL_POINTS) * 100 : 0
                    const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`
                    return (
                      <div key={entry.username} className="flex items-center gap-3 px-4 py-2.5 border border-orange-500/20 bg-black/40">
                        <span className="w-7 text-center flex-shrink-0 text-sm">
                          {typeof rank === 'string' && rank.startsWith('#')
                            ? <span className="text-xs text-orange-700">{rank}</span>
                            : rank}
                        </span>
                        <span className="w-28 text-xs text-orange-200 tracking-wider uppercase font-bold truncate flex-shrink-0">
                          {entry.username}
                        </span>
                        <div className="flex-1 h-2 bg-orange-900/40 rounded-sm overflow-hidden">
                          <motion.div
                            className="h-full bg-orange-500 rounded-sm"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.06, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </div>
                        <span className="text-xs text-orange-600 tracking-widest w-16 text-right flex-shrink-0">
                          {entry.total_points} / {TOTAL_POINTS}
                        </span>
                        <span className="text-xs text-orange-800 w-10 text-right flex-shrink-0 hidden sm:block">
                          {entry.discoveries_count}✓
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </Section>

            {/* ── Animateurs masqués ── */}
            <Section label="Classement" title="Masquer du Classement — Animateurs">
              <p className="text-xs text-orange-700 tracking-wide pb-2">
                Les utilisateurs masqués n'apparaissent plus dans le classement, le Wall of Fame ni les récompenses.
              </p>
              {users.length === 0 ? (
                <p className="text-xs text-orange-700 tracking-widest py-4 text-center">Aucun utilisateur inscrit.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {users.map(u => {
                    const isHidden = hiddenUsers.includes(u.username.toLowerCase())
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleHideUser(u.username)}
                        className={`flex items-center justify-between gap-2 px-3 py-2 border text-left transition-all ${
                          isHidden
                            ? 'border-orange-800/60 bg-orange-900/20 text-orange-700'
                            : 'border-orange-500/20 bg-black/40 text-orange-200 hover:border-orange-500/50'
                        }`}
                      >
                        <span className="text-xs tracking-wider uppercase font-bold truncate">{u.username}</span>
                        {isHidden
                          ? <EyeOff className="h-3.5 w-3.5 text-orange-700 flex-shrink-0" />
                          : <Eye className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                        }
                      </button>
                    )
                  })}
                </div>
              )}
              {hiddenUsers.length > 0 && (
                <p className="text-xs text-orange-700 tracking-widest pt-1">
                  {hiddenUsers.length} utilisateur{hiddenUsers.length > 1 ? 's' : ''} masqué{hiddenUsers.length > 1 ? 's' : ''} : {hiddenUsers.join(', ')}
                </p>
              )}
            </Section>

            {/* ── Classement Manuel — Récompenses ── */}
            <Section label="Récompenses" title="Classement Manuel — Top 6">
              <p className="text-xs text-orange-700 tracking-wide pb-3">
                Définissez l'ordre du classement ajusté. Ce classement remplace le classement automatique dans la page Récompenses. Maximum 6 scouts.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Classement manuel actuel */}
                <div className="space-y-2">
                  <p className="text-xs tracking-[0.2em] text-orange-600 uppercase pb-1 border-b border-orange-500/20">
                    Ordre actuel ({manualRanking.length}/6)
                  </p>
                  {manualRanking.length === 0 ? (
                    <p className="text-xs text-orange-800 tracking-widest py-4 text-center">
                      Aucun classement défini — cliquez sur des joueurs à droite pour les ajouter.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {manualRanking.map((username, i) => (
                        <div key={username} className="flex items-center gap-2 px-3 py-2 border border-orange-500/30 bg-black/40">
                          <span className="text-sm w-6 flex-shrink-0 text-center">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                          <span className="flex-1 text-xs tracking-wider uppercase font-bold text-orange-200 truncate">
                            {username}
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => moveManualRanking(i, -1)}
                              disabled={i === 0}
                              className="p-1 text-orange-600 hover:text-orange-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => moveManualRanking(i, 1)}
                              disabled={i === manualRanking.length - 1}
                              className="p-1 text-orange-600 hover:text-orange-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => removeFromManualRanking(username)}
                              className="p-1 text-orange-800 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={saveManualRanking}
                    disabled={manualRankingSaving || manualRanking.length === 0}
                    className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.2em] uppercase border transition-all ${
                      manualRankingSaved
                        ? 'border-green-500/50 bg-green-900/20 text-green-400'
                        : 'border-orange-500/50 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed'
                    }`}
                  >
                    {manualRankingSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : manualRankingSaved ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {manualRankingSaved ? 'Classement sauvegardé !' : 'Sauvegarder le classement'}
                  </button>
                </div>

                {/* Pool de joueurs */}
                <div className="space-y-2">
                  <p className="text-xs tracking-[0.2em] text-orange-600 uppercase pb-1 border-b border-orange-500/20">
                    Joueurs disponibles (classement auto)
                  </p>
                  {leaders.length === 0 ? (
                    <p className="text-xs text-orange-800 tracking-widest py-4 text-center">Aucun joueur inscrit.</p>
                  ) : (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {leaders.map((entry, i) => {
                        const inRanking = manualRanking.includes(entry.username)
                        return (
                          <button
                            key={entry.username}
                            onClick={() => inRanking ? removeFromManualRanking(entry.username) : addToManualRanking(entry.username)}
                            disabled={!inRanking && manualRanking.length >= 6}
                            className={`w-full flex items-center gap-2 px-3 py-2 border text-left transition-all ${
                              inRanking
                                ? 'border-orange-400/60 bg-orange-500/15 text-orange-300'
                                : manualRanking.length >= 6
                                ? 'border-orange-500/10 bg-black/20 text-orange-800 cursor-not-allowed'
                                : 'border-orange-500/20 bg-black/40 text-orange-200 hover:border-orange-500/50 hover:bg-orange-500/5'
                            }`}
                          >
                            <span className="text-xs text-orange-700 w-6 text-center flex-shrink-0">#{i + 1}</span>
                            <span className="flex-1 text-xs tracking-wider uppercase font-bold truncate">{entry.username}</span>
                            <span className="text-xs text-orange-800 flex-shrink-0">{entry.total_points} pts</span>
                            {inRanking
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                              : <Plus className="h-3.5 w-3.5 text-orange-700 flex-shrink-0" />
                            }
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Avancement par faille ── */}
            <Section label="Failles" title="Avancement par Faille">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eggProgress} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                    <XAxis type="number" tick={{ fill: C.axis, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, Math.max(totalPlayers, 1)]} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#fed7aa', fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="border border-orange-500/50 bg-black/95 px-3 py-2 font-terminal text-xs">
                          <p className="text-orange-300 font-bold">{d.name}</p>
                          <p className="text-orange-500">{d.count} scout{d.count > 1 ? 's' : ''} / {totalPlayers}</p>
                          <p className="text-orange-700">+{d.points} pts</p>
                        </div>
                      )
                    }} />
                    <Bar dataKey="count" name="Scouts" fill={C.primary} radius={[0, 3, 3, 0]}
                      label={{ position: 'right', fill: C.axis, fontSize: 10, formatter: (v: unknown) => (typeof v === 'number' && v > 0) ? v : '' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>

            {/* ── Connexions & Inscriptions ── */}
            <Section label="Activité" title="Connexions & Inscriptions dans le Temps">
              <div className="flex gap-1 mb-4">
                {(['day', 'hour', 'minute'] as Granularity[]).map(g => (
                  <button
                    key={g}
                    onClick={() => setGranularity(g)}
                    className={`px-3 py-1.5 text-xs tracking-[0.2em] uppercase border transition-all ${
                      granularity === g
                        ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                        : 'border-orange-500/30 text-orange-600 hover:border-orange-500/60'
                    }`}
                  >
                    {g === 'day' ? 'Jour' : g === 'hour' ? 'Heure' : 'Minute'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs tracking-widest text-orange-700 uppercase">Connexions — {connections.length} total</p>
                  {connectionsData.length === 0 ? (
                    <p className="text-xs text-orange-800 tracking-widest py-6 text-center">Aucune connexion</p>
                  ) : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={connectionsData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="connGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                          <XAxis dataKey="time" tick={{ fill: C.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: C.axis, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip content={<AuroraTooltip />} />
                          <Area type="monotone" dataKey="count" name="Connexions"
                            stroke="#f97316" strokeWidth={2} fill="url(#connGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs tracking-widest text-orange-700 uppercase">Inscriptions — {users.length} total</p>
                  {registrationsData.length === 0 ? (
                    <p className="text-xs text-orange-800 tracking-widest py-6 text-center">Aucune inscription</p>
                  ) : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={registrationsData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                          <XAxis dataKey="time" tick={{ fill: C.axis, fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: C.axis, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip content={<AuroraTooltip />} />
                          <Area type="monotone" dataKey="count" name="Inscriptions"
                            stroke="#a855f7" strokeWidth={2} fill="url(#regGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── Scanner & Factions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section label="Scanner" title="Mots les plus scannés">
                {topWordsData.length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucun scan</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topWordsData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
                        <XAxis type="number" tick={{ fill: C.axis, fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="word" tick={{ fill: '#fed7aa', fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
                        <Tooltip content={<AuroraTooltip />} />
                        <Bar dataKey="count" name="Scans" fill={C.primary} radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>

              <Section label="Scanner" title="Répartition par Factions">
                {factionData.filter(f => f.faction !== 'Inconnu').length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucun scan de membre</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={factionData} dataKey="count" nameKey="faction"
                          cx="50%" cy="50%" outerRadius={90} strokeWidth={1} stroke="rgba(0,0,0,0.5)">
                          {factionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]
                          return (
                            <div className="border border-orange-500/50 bg-black/95 px-3 py-2 font-terminal text-xs">
                              <p style={{ color: d.payload.fill }} className="font-bold">{d.name}</p>
                              <p className="text-orange-300">{d.value} scans</p>
                            </div>
                          )
                        }} />
                        <Legend formatter={(v) => <span className="text-xs text-orange-400 tracking-wider">{v}</span>} iconSize={8} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>
            </div>

            {/* ── Retours terrain ── */}
            <Section label="Retours" title="Avis des Scouts">
              {ratings.length === 0 ? (
                <p className="text-xs text-orange-700 tracking-widest py-4 text-center">Aucun avis reçu.</p>
              ) : (
                <div className="space-y-4">
                  {/* Note moyenne */}
                  <div className="flex items-center gap-4 border border-orange-500/20 bg-black/40 px-4 py-3">
                    <div>
                      <p className="text-xs tracking-[0.2em] text-orange-600 uppercase">Note moyenne</p>
                      <p className="text-2xl font-bold text-orange-300 tracking-wider">
                        {(ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)}
                        <span className="text-sm text-orange-600 font-normal"> / 5</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(n => {
                        const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
                        return (
                          <span key={n} className={`text-lg ${n <= Math.round(avg) ? 'text-orange-400' : 'text-orange-900'}`}>★</span>
                        )
                      })}
                    </div>
                    <p className="ml-auto text-xs text-orange-700 tracking-widest">{ratings.length} avis</p>
                  </div>

                  {/* Liste des avis */}
                  <div className="space-y-2">
                    {ratings.map(r => (
                      <div key={r.id} className="border border-orange-500/15 bg-black/30 px-4 py-3 space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold tracking-wider uppercase text-orange-200">{r.username}</span>
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <span key={n} className={`text-sm ${n <= r.rating ? 'text-orange-400' : 'text-orange-900'}`}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-orange-800 tracking-widest ml-auto">{fmtBrussels(r.created_at)}</span>
                        </div>
                        <p className="text-xs text-orange-500 tracking-wide leading-relaxed">{r.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* ── Données brutes ── */}
            <Section label="Base de données" title="Données Brutes">
              <div className="flex flex-wrap gap-1 mb-4">
                {RAW_TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => { setRawTab(i); setPage(0) }}
                    className={`px-3 py-1.5 text-xs tracking-[0.2em] uppercase border transition-all ${
                      rawTab === i
                        ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                        : 'border-orange-500/30 text-orange-600 hover:border-orange-500/60'
                    }`}
                  >
                    {tab}
                    <span className="ml-1.5 text-orange-800">
                      ({allRawRows(i).length})
                    </span>
                  </button>
                ))}
              </div>
              <motion.div
                key={rawTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="border border-orange-500/20 bg-black/40"
              >
                <RawTable
                  columns={RAW_COLUMNS[rawTab]}
                  rows={allRawRows(rawTab).slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)}
                />
              </motion.div>
              {(() => {
                const total = allRawRows(rawTab).length
                const totalPages = Math.ceil(total / PAGE_SIZE)
                const start = page * PAGE_SIZE + 1
                const end = Math.min((page + 1) * PAGE_SIZE, total)
                return (
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-orange-800 tracking-wider">
                      {total === 0 ? '0 entrée' : `${start}–${end} sur ${total}`}
                    </p>
                    {totalPages > 1 && (
                      <div className="flex gap-1">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                          className="px-2 py-1 text-xs border border-orange-500/30 text-orange-600 hover:border-orange-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                          ← Préc.
                        </button>
                        <span className="px-2 py-1 text-xs text-orange-700">{page + 1} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                          className="px-2 py-1 text-xs border border-orange-500/30 text-orange-600 hover:border-orange-500/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                          Suiv. →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </Section>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
