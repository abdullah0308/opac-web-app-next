'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export interface WardOption {
  id: string
  name: string
  archerId?: string
  avatarUrl?: string
}

interface WardSwitcherProps {
  wards: WardOption[]
  /** The account currently on screen. */
  subjectId: string
  viewerId: string
  viewerName: string
  isProxy: boolean
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Shown only to parents and guardians. Collapsed it is a single line saying
 * whose account is on screen; opened it lists the guardian's own account and
 * each child they look after.
 */
export function WardSwitcher({
  wards,
  subjectId,
  viewerId,
  viewerName,
  isProxy,
}: WardSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  if (wards.length === 0) return null

  const current = isProxy ? wards.find((w) => w.id === subjectId) : null
  const label = current ? current.name : viewerName

  async function switchTo(archerId: string | null) {
    setBusy(true)
    try {
      await fetch('/api/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archerId }),
      })
      setOpen(false)
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  const rows: { id: string | null; name: string; sub: string; avatarUrl?: string }[] = [
    { id: null, name: viewerName, sub: 'My own account', avatarUrl: undefined },
    ...wards.map((w) => ({
      id: w.id,
      name: w.name,
      sub: w.archerId ? `Archer ${w.archerId}` : 'Archer',
      avatarUrl: w.avatarUrl,
    })),
  ]

  const activeId = isProxy ? subjectId : null

  return (
    <div className="px-5 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`glass-card w-full rounded-[15px] px-4 py-2.5 flex items-center gap-3 text-left transition-transform duration-200 ease-glide active:scale-[0.99] ${
          isProxy ? 'border-l-[3px] border-l-opac-gold' : ''
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isProxy ? 'bg-opac-gold' : 'bg-opac-green'
          }`}
        />
        <span className="flex-1 min-w-0">
          <span className="block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-opac-ink-30">
            {isProxy ? 'Viewing as' : 'Signed in as'}
          </span>
          <span className="block font-body text-[14px] font-semibold text-opac-ink truncate">
            {label}
          </span>
        </span>
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="#5C5C58"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-[15px] mt-2 p-1.5 flex flex-col gap-0.5">
              {rows.map((row) => {
                const active = row.id === activeId
                return (
                  <button
                    key={row.id ?? 'self'}
                    disabled={busy || pending}
                    onClick={() => switchTo(row.id)}
                    className={`flex items-center gap-3 px-2.5 py-2 rounded-[11px] text-left transition-colors duration-200 disabled:opacity-50 ${
                      active ? 'bg-[rgba(46,125,79,0.12)]' : 'hover:bg-[rgba(26,26,24,0.04)]'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[rgba(212,234,217,0.85)] border border-[rgba(255,255,255,0.8)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {row.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.avatarUrl}
                          alt={row.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-display text-[11px] text-opac-green">
                          {initials(row.name)}
                        </span>
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-body text-[13.5px] font-semibold text-opac-ink truncate">
                        {row.name}
                      </span>
                      <span className="block font-body text-[11.5px] text-opac-ink-60">
                        {row.sub}
                      </span>
                    </span>
                    {active && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3.5 8.5L6.5 11.5L12.5 5"
                          stroke="#2E7D4F"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
