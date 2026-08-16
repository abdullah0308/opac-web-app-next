'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'opac-install-dismissed'
const DISMISS_DAYS = 14

function recentlyDismissed() {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY))
    if (!ts) return false
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari doesn't support display-mode
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  const ua = window.navigator.userAgent
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ reports as desktop Safari
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    // Already installed, or dismissed recently — stay out of the way.
    if (isStandalone() || recentlyDismissed()) return

    // Android/Chrome/Edge: wait for the browser to say it's installable.
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS never fires that event, so prompt with manual instructions instead.
    let timer: ReturnType<typeof setTimeout> | undefined
    if (isIOS()) {
      setIos(true)
      timer = setTimeout(() => setShow(true), 3000)
    }

    const installed = () => setShow(false)
    window.addEventListener('appinstalled', installed)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
      if (timer) clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* private mode — just close */
    }
    setShow(false)
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  const features = [
    { icon: '⚡', label: 'Faster' },
    { icon: '🏠', label: 'Home screen' },
    { icon: '📴', label: 'Full screen' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/48 z-40" onClick={dismiss} />

      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[390px] mx-auto bg-white rounded-t-[24px] px-7 pt-3 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.18)]">
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-[#E0E8E0]" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[14px] bg-opac-green flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl font-display">O</span>
          </div>
          <span className="font-display text-[18px] text-opac-ink">OPAC</span>
        </div>

        <h3 className="font-display text-[20px] text-opac-ink leading-snug mb-2">
          Add OPAC to your home screen
        </h3>
        <p className="text-[13px] text-opac-ink-60 leading-relaxed">
          Open OPAC like an app — full screen, one tap from your home screen.
        </p>

        {ios ? (
          /* iOS can't be triggered programmatically — walk them through it. */
          <ol className="mt-5 space-y-3 list-none p-0 m-0">
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-opac-green-light text-opac-green text-[12px] font-semibold flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-[13px] text-opac-ink">
                Tap the <strong>Share</strong> button in Safari&rsquo;s toolbar
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-opac-green-light text-opac-green text-[12px] font-semibold flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-[13px] text-opac-ink">
                Scroll down and choose <strong>Add to Home Screen</strong>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-opac-green-light text-opac-green text-[12px] font-semibold flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-[13px] text-opac-ink">
                Tap <strong>Add</strong> — done
              </span>
            </li>
          </ol>
        ) : (
          <div className="flex justify-center gap-7 mt-5">
            {features.map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-[22px]">{icon}</span>
                <span className="text-[11px] text-opac-ink-60 text-center">{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-5" />

        {ios ? (
          <button
            onClick={dismiss}
            className="w-full py-4 rounded-[14px] bg-opac-green text-white font-semibold text-[15px] border-none cursor-pointer"
          >
            Got it
          </button>
        ) : (
          <>
            <button
              onClick={handleInstall}
              className="w-full py-4 rounded-[14px] bg-opac-green text-white font-semibold text-[15px] border-none cursor-pointer"
            >
              Add to Home Screen
            </button>
            <div className="h-4" />
            <div className="flex justify-center">
              <button
                onClick={dismiss}
                className="text-[14px] text-opac-ink-30 bg-transparent border-none cursor-pointer"
              >
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
