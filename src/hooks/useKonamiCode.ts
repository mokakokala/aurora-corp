import { useEffect, useRef } from 'react'

const SEQUENCE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

function normalizeKey(e: KeyboardEvent) {
  return e.key.length === 1 ? e.key.toLowerCase() : e.key
}

export function useKonamiCode(onSuccess: () => void) {
  const step = useRef(0)
  const cb = useRef(onSuccess)
  cb.current = onSuccess

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const key = normalizeKey(e)
      if (key === SEQUENCE[step.current]) {
        step.current++
        if (step.current === SEQUENCE.length) {
          step.current = 0
          cb.current()
        }
      } else if (key.startsWith('Arrow') || key === 'b' || key === 'a') {
        step.current = key === SEQUENCE[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [])
}
