import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X, RefreshCw, Users, Dna, KeyRound, Trophy, Music,
  AlertTriangle, BarChart3, Loader2, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { supabase } from '../../lib/supabase'
import {
  SUPABASE_TABLE, OVERRIDE_LOG_TABLE, DNA_SCAN_TABLE,
  KONAMI_TABLE, PUNISHMENT_TABLE, FAILED_OVERRIDE_TABLE, AUDIO_UNLOCK_TABLE,
} from '../../config/constants'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScoutLogin {
  id: number; prenom_totem: string; age: number
  created_at: string; ip: string | null; city: string | null
}
interface OverrideLog {
  id: number; prenom_totem: string; age: number | null
  override_at: string; ip: string | null; city: string | null
}
interface DnaScan {
  id: number; logged_as: string; scanned_id: string
  created_at: string; ip: string | null; city: string | null
}
interface KonamiLog {
  id: number; totem: string
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
interface AudioUnlock {
  id: number; prenom_totem: string; age: number | null
  unlocked_at: string; ip: string | null; city: string | null
}


// ─── Faction lookup (mirrors DNAScannerModule logic) ─────────────────────────

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

function normalizeName(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
function findFactionForScan(id: string): string {
  const n = normalizeName(id)
  for (const [name, faction] of MEMBER_FACTIONS) {
    if (n.includes(normalizeName(name))) return faction
  }
  return 'Inconnu'
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const FACTION_COLORS: Record<string, string> = {
  'Évadés': '#f97316',
  'Conquérants': '#ef4444',
  'Coexistants': '#22c55e',
  'Bâtisseurs': '#eab308',
  'Explorateurs': '#3b82f6',
  'Croyants': '#a855f7',
  'Survivants': '#14b8a6',
  'Inconnu': '#6b7280',
}

const CHART_COLORS = {
  primary: '#f97316',
  secondary: '#ea580c',
  muted: 'rgba(249,115,22,0.15)',
  grid: 'rgba(249,115,22,0.12)',
  axis: '#7c3d12',
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

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

// ─── Brussels timezone helpers ───────────────────────────────────────────────

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

// ─── Data helpers ─────────────────────────────────────────────────────────────

type Granularity = 'day' | 'hour' | 'minute'

function buildConnectionsData(logins: ScoutLogin[], granularity: Granularity) {
  const counts: Record<string, number> = {}
  for (const l of logins) {
    const p = getBrusselsParts(l.created_at)
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
    const f = findFactionForScan(s.scanned_id)
    counts[f] = (counts[f] || 0) + 1
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([faction, count]) => ({ faction, count, fill: FACTION_COLORS[faction] ?? '#6b7280' }))
}

function buildAgeData(logins: ScoutLogin[]) {
  const counts: Record<number, number> = {}
  for (const l of logins) {
    counts[l.age] = (counts[l.age] || 0) + 1
  }
  return Object.entries(counts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([age, count]) => ({ age, count }))
}

function buildCityData(logins: ScoutLogin[], limit = 10) {
  const counts: Record<string, number> = {}
  for (const l of logins) {
    if (l.city) counts[l.city] = (counts[l.city] || 0) + 1
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([city, count]) => ({ city, count }))
}

function buildRatingData(punishments: PunishmentLog[]) {
  const counts: Record<number, number> = {}
  for (let i = 0; i <= 10; i++) counts[i] = 0
  for (const p of punishments) {
    if (p.rating !== null) counts[p.rating] = (counts[p.rating] || 0) + 1
  }
  return Object.entries(counts).map(([r, count]) => ({ note: r, count }))
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

function KpiCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string
}) {
  return (
    <div className="border border-orange-500/30 bg-black/60 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-orange-600" />
        <p className="text-xs tracking-[0.2em] text-orange-600 uppercase">{label}</p>
      </div>
      <p className="text-2xl font-bold text-orange-300 tracking-wider">{value}</p>
      {sub && <p className="text-xs text-orange-700 tracking-wider">{sub}</p>}
    </div>
  )
}

// ─── Raw table ────────────────────────────────────────────────────────────────

function RawTable({ columns, rows }: { columns: string[]; rows: (string | number | null)[][] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-orange-700 tracking-widest py-4 text-center">Aucune donnée</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-terminal border-collapse">
        <thead>
          <tr className="border-b border-orange-500/30">
            {columns.map(c => (
              <th key={c} className="text-left py-2 px-3 text-orange-600 tracking-widest uppercase whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-orange-500/10 hover:bg-orange-500/5 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-1.5 px-3 text-orange-200 whitespace-nowrap max-w-[200px] truncate">
                  {cell === null || cell === undefined ? (
                    <span className="text-orange-800">—</span>
                  ) : (
                    String(cell)
                  )}
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
  const [activeTab, setActiveTab] = useState(0)

  const [scouts, setScouts] = useState<ScoutLogin[]>([])
  const [overrides, setOverrides] = useState<OverrideLog[]>([])
  const [dnaScans, setDnaScans] = useState<DnaScan[]>([])
  const [konamiLogs, setKonamiLogs] = useState<KonamiLog[]>([])
  const [punishments, setPunishments] = useState<PunishmentLog[]>([])
  const [failedLogs, setFailedLogs] = useState<FailedLog[]>([])
  const [audioUnlocks, setAudioUnlocks] = useState<AudioUnlock[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [s, o, d, k, p, f, a] = await Promise.all([
      supabase.from(SUPABASE_TABLE).select('*').order('created_at', { ascending: false }),
      supabase.from(OVERRIDE_LOG_TABLE).select('*').order('override_at', { ascending: false }),
      supabase.from(DNA_SCAN_TABLE).select('*').order('created_at', { ascending: false }),
      supabase.from(KONAMI_TABLE).select('*').order('created_at', { ascending: false }),
      supabase.from(PUNISHMENT_TABLE).select('*').order('punished_at', { ascending: false }),
      supabase.from(FAILED_OVERRIDE_TABLE).select('*').order('failed_at', { ascending: false }),
      supabase.from(AUDIO_UNLOCK_TABLE).select('*').order('unlocked_at', { ascending: false }),
    ])
    setScouts((s.data ?? []) as ScoutLogin[])
    setOverrides((o.data ?? []) as OverrideLog[])
    setDnaScans((d.data ?? []) as DnaScan[])
    setKonamiLogs((k.data ?? []) as KonamiLog[])
    setPunishments((p.data ?? []) as PunishmentLog[])
    setFailedLogs((f.data ?? []) as FailedLog[])
    setAudioUnlocks((a.data ?? []) as AudioUnlock[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // KPIs
  const uniqueTotems = new Set(scouts.map(s => normalizeName(s.prenom_totem))).size
  const bypassed = punishments.filter(p => p.bypassed).length
  const totalPunishments = punishments.length
  const pctSansSkip = totalPunishments > 0
    ? Math.round((totalPunishments - bypassed) / totalPunishments * 100)
    : 0
  const avgRating = (() => {
    const rated = punishments.filter(p => p.rating !== null)
    if (!rated.length) return '—'
    return (rated.reduce((sum, p) => sum + p.rating!, 0) / rated.length).toFixed(1)
  })()

  // Chart data
  const connectionsData = buildConnectionsData([...scouts].reverse(), granularity)
  const topWordsData = buildTopWords(dnaScans)
  const factionData = buildFactionData(dnaScans)
  const ageData = buildAgeData(scouts)
  const cityData = buildCityData(scouts)
  const ratingData = buildRatingData(punishments)

  // Table tabs
  const TABS = ['Scouts', 'Scans ADN', 'Overrides', 'Punitions', 'Konami', 'Tentatives', 'Audio']

  const renderTable = (tab: number) => {
    switch (tab) {
      case 0:
        return <RawTable
          columns={['Prénom/Totem', 'Âge', 'Ville', 'IP', 'Date']}
          rows={scouts.slice(0, 50).map(s => [
            s.prenom_totem, s.age, s.city, s.ip, fmtBrussels(s.created_at)
          ])}
        />
      case 1:
        return <RawTable
          columns={['Scanné', 'Enregistré sous', 'Ville', 'IP', 'Date']}
          rows={dnaScans.slice(0, 50).map(d => [
            d.scanned_id, d.logged_as, d.city, d.ip, fmtBrussels(d.created_at)
          ])}
        />
      case 2:
        return <RawTable
          columns={['Prénom/Totem', 'Âge', 'Ville', 'IP', 'Date Override']}
          rows={overrides.map(o => [
            o.prenom_totem, o.age, o.city, o.ip, fmtBrussels(o.override_at)
          ])}
        />
      case 3:
        return <RawTable
          columns={['Prénom/Totem', 'Punition #', 'Bypassé', 'Note', 'Commentaire', 'Date']}
          rows={punishments.map(p => [
            p.prenom_totem, p.punishment_number,
            p.bypassed ? 'Oui' : 'Non',
            p.rating ?? null, p.comment,
            fmtBrussels(p.punished_at)
          ])}
        />
      case 4:
        return <RawTable
          columns={['Totem/Prénom', 'Ville', 'IP', 'Date']}
          rows={konamiLogs.map(k => [
            k.totem, k.city, k.ip, fmtBrussels(k.created_at)
          ])}
        />
      case 5:
        return <RawTable
          columns={['Prénom/Totem', 'Âge', 'Code tenté', 'Ville', 'IP', 'Date']}
          rows={failedLogs.map(f => [
            f.prenom_totem, f.age, f.code_tried, f.city, f.ip, fmtBrussels(f.failed_at)
          ])}
        />
      case 6:
        return <RawTable
          columns={['Prénom/Totem', 'Âge', 'Ville', 'IP', 'Date débloqué']}
          rows={audioUnlocks.map(a => [
            a.prenom_totem, a.age, a.city, a.ip, fmtBrussels(a.unlocked_at)
          ])}
        />
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
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-1.5 border border-orange-500/40 bg-orange-500/10 px-3 py-1.5 text-xs tracking-[0.2em] text-orange-400 uppercase hover:bg-orange-500/20 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={onClose}
            className="text-orange-700 hover:text-orange-400 transition-colors"
          >
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
            <Section label="Indicateurs" title="Métriques Clés">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <KpiCard icon={Users} label="Scouts identifiés" value={scouts.length}
                  sub={`${uniqueTotems} totem${uniqueTotems > 1 ? 's' : ''} unique${uniqueTotems > 1 ? 's' : ''}`} />
                <KpiCard icon={Dna} label="Scans ADN" value={dnaScans.length} />
                <KpiCard icon={KeyRound} label="Overrides réussis" value={overrides.length} />
                <KpiCard icon={AlertTriangle} label="Tentatives échouées" value={failedLogs.length}
                  sub="Sur le code classifié" />
                <KpiCard icon={Trophy} label="Apéros réclamés" value={`${konamiLogs.length} / 5`}
                  sub="Code Konami" />
                <KpiCard icon={Music} label="Sans skip Crousty" value={`${pctSansSkip}%`}
                  sub={`${totalPunishments - bypassed} / ${totalPunishments} punitions`} />
                <KpiCard icon={BarChart3} label="Note moy. punition" value={avgRating}
                  sub="Sur 10" />
                <KpiCard icon={Music} label="2ème audio débloqué" value={audioUnlocks.length}
                  sub="Via le mini-jeu fréquences" />
                <KpiCard icon={Users} label="Connexions auj." value={
                  scouts.filter(s => {
          const p = getBrusselsParts(s.created_at)
          const today = getBrusselsParts(new Date().toISOString())
          return p.year === today.year && p.month === today.month && p.day === today.day
        }).length
                } sub={new Date().toLocaleDateString('fr-FR')} />
              </div>
            </Section>

            {/* ── Connexions ── */}
            <Section label="Graphique" title="Flux de Connexions">
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
              {connectionsData.length === 0 ? (
                <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucune connexion</p>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={connectionsData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                      <XAxis dataKey="time" tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<AuroraTooltip />} />
                      <Area
                        type="monotone" dataKey="count" name="Connexions"
                        stroke={CHART_COLORS.primary} strokeWidth={2}
                        fill="url(#areaGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Section>

            {/* ── Scanner ADN ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section label="Graphique" title="Mots les plus scannés">
                {topWordsData.length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucun scan</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topWordsData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="word" tick={{ fill: '#fed7aa', fontSize: 10 }} tickLine={false} axisLine={false} width={70} />
                        <Tooltip content={<AuroraTooltip />} />
                        <Bar dataKey="count" name="Scans" fill={CHART_COLORS.primary} radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>

              <Section label="Graphique" title="Répartition par Factions">
                {factionData.filter(f => f.faction !== 'Inconnu').length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucun scan de membre</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={factionData}
                          dataKey="count"
                          nameKey="faction"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          strokeWidth={1}
                          stroke="rgba(0,0,0,0.5)"
                        >
                          {factionData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0]
                            return (
                              <div className="border border-orange-500/50 bg-black/95 px-3 py-2 font-terminal text-xs">
                                <p style={{ color: d.payload.fill }} className="font-bold">{d.name}</p>
                                <p className="text-orange-300">{d.value} scans</p>
                              </div>
                            )
                          }}
                        />
                        <Legend
                          formatter={(value) => <span className="text-xs text-orange-400 tracking-wider">{value}</span>}
                          iconSize={8}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>
            </div>

            {/* ── Démographie ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section label="Graphique" title="Distribution des Âges">
                {ageData.length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucune donnée</p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                        <XAxis dataKey="age" tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<AuroraTooltip />} />
                        <Bar dataKey="count" name="Scouts" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>

              <Section label="Graphique" title="Origines Géographiques">
                {cityData.length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucune donnée de localisation</p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cityData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="city" tick={{ fill: '#fed7aa', fontSize: 9 }} tickLine={false} axisLine={false} width={80} />
                        <Tooltip content={<AuroraTooltip />} />
                        <Bar dataKey="count" name="Scouts" fill="#ea580c" radius={[0, 2, 2, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>
            </div>

            {/* ── Punitions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Section label="Graphique" title="Notes de la Punition">
                {ratingData.filter(r => r.count > 0).length === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucune note soumise</p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ratingData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                        <XAxis dataKey="note" tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fill: '#7c3d12', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<AuroraTooltip />} />
                        <Bar dataKey="count" name="Votes" fill="#a855f7" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>

              <Section label="Graphique" title="Bypass vs Punition Subie">
                {totalPunishments === 0 ? (
                  <p className="text-xs text-orange-700 tracking-widest py-8 text-center">Aucune punition</p>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Sans skip (subies)', value: totalPunishments - bypassed, fill: '#ef4444' },
                            { name: 'Skip Crousty', value: bypassed, fill: '#22c55e' },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          strokeWidth={1}
                          stroke="rgba(0,0,0,0.5)"
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#22c55e" />
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0]
                            return (
                              <div className="border border-orange-500/50 bg-black/95 px-3 py-2 font-terminal text-xs">
                                <p style={{ color: d.payload.fill }} className="font-bold">{d.name}</p>
                                <p className="text-orange-300">{d.value}</p>
                              </div>
                            )
                          }}
                        />
                        <Legend
                          formatter={(value) => <span className="text-xs text-orange-400 tracking-wider">{value}</span>}
                          iconSize={8}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>
            </div>

            {/* ── Données brutes ── */}
            <Section label="Base de données" title="Données Brutes">
              <div className="flex flex-wrap gap-1 mb-4">
                {TABS.map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(i)}
                    className={`px-3 py-1.5 text-xs tracking-[0.2em] uppercase border transition-all ${
                      activeTab === i
                        ? 'border-orange-500 bg-orange-500/15 text-orange-300'
                        : 'border-orange-500/30 text-orange-600 hover:border-orange-500/60'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="border border-orange-500/20 bg-black/40"
              >
                {renderTable(activeTab)}
              </motion.div>
              <p className="text-xs text-orange-800 tracking-wider text-right mt-1">
                {[scouts.length, dnaScans.length, overrides.length, punishments.length, konamiLogs.length, failedLogs.length, audioUnlocks.length][activeTab]} entrée(s) — 50 max affichées
              </p>
            </Section>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
