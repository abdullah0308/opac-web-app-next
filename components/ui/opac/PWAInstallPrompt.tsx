'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  const features = [
    { icon: '📱', label: 'Works offline' },
    { icon: '🔔', label: 'Notifications' },
    { icon: '⚡', label: 'Faster' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/48 z-40"
        onClick={() => setShow(false)}
      />
      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[390px] mx-auto bg-white rounded-t-[24px] px-7 pt-3 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.18)]">
        {/* Drag handle */}
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-[#E0E8E0]" />
        </div>

        {/* App identity */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-[14px] bg-[#2E7D4F] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xl font-serif">O</span>
          </div>
          <span className="font-display text-[18px] text-[#1A2B1A]">OPAC</span>
        </div>

        <h3 className="font-display text-[20px] text-[#1A2B1A] leading-snug mb-2">
          Add OPAC to your home screen
        </h3>
        <p className="text-[13px] text-[#5A7A5A] leading-relaxed">
          Get the full app experience — faster check-ins, instant notifications, offline access
        </p>

        {/* Features */}
        <div className="flex justify-center gap-7 mt-5">
          {features.map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[22px]">{icon}</span>
              <span className="text-[11px] text-[#5A7A5A] text-center">{label}</span>
            </div>
          ))}
        </div>

        <div className="h-5" />

        <button
          onClick={handleInstall}
          className="w-full py-4 rounded-[14px] bg-[#2E7D4F] text-white font-semibold text-[15px] border-none cursor-pointer"
        >
          Add to Home Screen
        </button>

        <div className="h-4" />

        <div className="flex justify-center">
          <button
            onClick={() => setShow(false)}
            className="text-[14px] text-[#9AB09A] bg-transparent border-none cursor-pointer"
          >
            Not now
          </button>
        </div>
      </div>
    </>
  )
}
