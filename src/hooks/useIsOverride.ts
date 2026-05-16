import { useState, useEffect } from 'react'

export function useIsOverride() {
  const [active, setActive] = useState(
    () => document.documentElement.classList.contains('override-active')
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setActive(document.documentElement.classList.contains('override-active'))
    })
    observer.observe(document.documentElement, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return active
}
