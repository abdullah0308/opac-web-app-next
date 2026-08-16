'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Skip in dev: cache-first on /_next/static/ would serve stale HMR chunks.
    if (process.env.NODE_ENV !== 'production') return

    let reg: ServiceWorkerRegistration | undefined

    navigator.serviceWorker
      .register('/sw.js')
      .then((r) => {
        reg = r
      })
      .catch(() => {})

    // Installed apps can stay open for days — look for a new build on refocus.
    const check = () => {
      if (document.visibilityState === 'visible') reg?.update().catch(() => {})
    }
    document.addEventListener('visibilitychange', check)

    return () => document.removeEventListener('visibilitychange', check)
  }, [])

  return null
}
