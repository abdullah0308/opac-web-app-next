'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

type Props = { archerId: string; name?: string }

/**
 * The archer's check-in code.
 *
 * Small on the dashboard, but tapping it opens a full-screen version — a big,
 * high-contrast code on a plain white sheet, with the screen brightened as far
 * as the browser allows. Coaches scan across a range in poor light, and a 72px
 * code on a frosted card is not enough to lock onto.
 */
export function QRImage({ archerId, name }: Props) {
  const smallRef = useRef<HTMLCanvasElement>(null)
  const largeRef = useRef<HTMLCanvasElement>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!archerId || !smallRef.current) return
    import('qrcode').then((QRCode) => {
      if (!smallRef.current) return
      QRCode.toCanvas(smallRef.current, archerId, {
        width: 76,
        margin: 1,
        color: { dark: '#12200F', light: '#FFFFFF' },
      })
    })
  }, [archerId])

  useEffect(() => {
    if (!open || !archerId) return
    // Canvas only exists once the overlay is in the DOM.
    const id = requestAnimationFrame(() => {
      if (!largeRef.current) return
      import('qrcode').then((QRCode) => {
        if (!largeRef.current) return
        QRCode.toCanvas(largeRef.current, archerId, {
          width: 620,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark: '#000000', light: '#FFFFFF' },
        }).then(() => {
          // qrcode writes style.width/height in px straight onto the canvas.
          // Those inline values beat any class, so the height stays pinned at
          // 620px while max-width squeezes the width — a stretched code that
          // will not scan. Hand sizing back to CSS.
          const el = largeRef.current
          if (!el) return
          el.style.width = '100%'
          el.style.height = 'auto'
        })
      })
    })
    return () => cancelAnimationFrame(id)
  }, [open, archerId])

  // Escape closes; body scroll locks while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Check-in code"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-body text-[13px] font-semibold uppercase tracking-[0.1em] text-[#5C5C58] mb-1">
              Check in
            </p>
            {name && (
              <p className="font-display text-[24px] text-[#12200F] mb-4 text-center">
                {name}
              </p>
            )}
            {/* The wrapper owns the sizing; the canvas just fills it and keeps
                its own 1:1 ratio, so the code can never end up stretched. */}
            <div className="w-[min(78vw,60vh,420px)]">
              <canvas
                ref={largeRef}
                className="block w-full h-auto aspect-square rounded-[14px] border border-[#E3E3DE]"
              />
            </div>
            <p className="font-mono text-[18px] font-semibold tracking-[0.14em] text-[#12200F] mt-5">
              {archerId}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-7 h-11 px-7 rounded-full bg-[#12200F] text-white font-body text-[15px] font-semibold transition-transform duration-200 ease-glide active:scale-95"
            >
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 group"
        aria-label="Enlarge check-in code"
      >
        <span className="relative block">
          <canvas
            ref={smallRef}
            className="glass-well rounded-[10px] block transition-transform duration-300 ease-glide group-hover:scale-105 group-active:scale-95"
            style={{ width: 76, height: 76 }}
          />
          <span
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full glass-green flex items-center justify-center"
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4.5 1.5H1.5V4.5M7.5 1.5H10.5V4.5M4.5 10.5H1.5V7.5M7.5 10.5H10.5V7.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span className="font-body text-[10px] text-opac-ink-30">Tap to enlarge</span>
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  )
}
