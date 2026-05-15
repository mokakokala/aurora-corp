// ─── Edit these values to maintain the app ───────────────────────────────────

export const GLITCH_INTERVAL_MS = 45000
export const GLITCH_DURATION_MS = 800

/** Target unlock date — next Monday at 16:00 local time */
export const TARGET_DATE = new Date('2026-05-18T16:00:00')

export const GPS_COORDINATES = { lat: 44.517008, lng: 15.53136 }

export const GROUP_LABELS = [
  'Évadés',
  'Conquérants',
  'Coexistants',
  'Bâtisseurs',
  'Explorateurs',
  'Croyants',
  'Survivants',
]

export const SUPABASE_TABLE = 'scouts_login'
export const OVERRIDE_LOG_TABLE = 'override_logs'

/** Marker positions as percentage of canvas size (x%, y%) */
export const MARKER_POSITIONS: [number, number][] = [
  [38, 28],
  [62, 24],
  [72, 42],
  [65, 62],
  [48, 70],
  [30, 60],
  [24, 40],
]

/** Wreck position as percentage of canvas size */
export const WRECK_POSITION: [number, number] = [50, 45]
