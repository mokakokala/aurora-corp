export interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export interface MarkerInfo {
  index: number
  label: string
  x: number
  y: number
}
