import { useEffect } from 'react'

const BASE_TITLE = 'A.U.R.O.R.A CORP'

export function useTabTitle() {
  useEffect(() => {
    document.title = BASE_TITLE

    const handle = () => {
      if (document.hidden) {
        document.title = '⚠ INTRUSION DÉTECTÉE'
      } else {
        document.title = 'CONNEXION RÉTABLIE'
        const t = setTimeout(() => { document.title = BASE_TITLE }, 2000)
        return () => clearTimeout(t)
      }
    }

    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [])
}
