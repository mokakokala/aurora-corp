import { useState, useEffect, useCallback } from 'react'
import type { CountdownResult } from '../types'

export function useCountdown(target: Date): CountdownResult {
  const calculate = useCallback((): CountdownResult => {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return { days, hours, minutes, seconds, expired: false }
  }, [target])

  const [state, setState] = useState<CountdownResult>(calculate)

  useEffect(() => {
    const id = setInterval(() => setState(calculate()), 1000)
    return () => clearInterval(id)
  }, [calculate])

  return state
}
