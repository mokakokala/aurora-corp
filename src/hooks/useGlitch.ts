import { useState, useEffect } from 'react'
import { GLITCH_INTERVAL_MS, GLITCH_DURATION_MS } from '../config/constants'

export function useGlitch(): boolean {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    const trigger = () => {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), GLITCH_DURATION_MS)
    }
    const id = setInterval(trigger, GLITCH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return isGlitching
}
