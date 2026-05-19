// ─── Edit these values to maintain the app ───────────────────────────────────

export const GLITCH_INTERVAL_MS = 60000
export const GLITCH_DURATION_MS = 800

/** Target unlock date — next Monday at 16:00 local time */
export const TARGET_DATE = new Date('2026-05-25T15:00:00')

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
export const DNA_SCAN_TABLE = 'dna_scans'
export const KONAMI_TABLE = 'konami_logs'
export const PUNISHMENT_TABLE = 'punishment_logs'
export const FAILED_OVERRIDE_TABLE = 'failed_override_logs'
export const AUDIO_UNLOCK_TABLE = 'audio_unlocks'
export const SERVAL_COMMENTS_TABLE = 'serval_comments'
