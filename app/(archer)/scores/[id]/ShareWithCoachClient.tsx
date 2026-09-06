'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Share2, Loader2 } from 'lucide-react'

export interface CoachOption {
  id: string
  name: string
}

interface Props {
  scoreId: string
  coaches: CoachOption[]
  sharedWithId: string | null
  verified: boolean
  coachFeedback?: string
  verifiedByName?: string
}

/**
 * Lets an archer hand one training round to a coach to look at, and shows the
 * coach's reply once it comes back.
 */
export default function ShareWithCoachClient({
  scoreId,
  coaches,
  sharedWithId,
  verified,
  coachFeedback,
  verifiedByName,
}: Props) {
  const router = useRouter()
  const [picking, setPicking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const sharedCoach = coaches.find((c) => c.id === sharedWithId)

  async function share(coachId: string | null) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/scores/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreId, coachId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not share')
      setPicking(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not share')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-card rounded-[16px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-1">
            Coach review
          </p>
          <p className="font-body text-[14px] font-semibold text-opac-ink">
            {sharedCoach
              ? verified
                ? `Checked by ${verifiedByName ?? sharedCoach.name}`
                : `Shared with ${sharedCoach.name}`
              : 'Not shared yet'}
          </p>
          {!sharedCoach && (
            <p className="font-body text-[12.5px] text-opac-ink-60 mt-0.5">
              Send this round to a coach for feedback.
            </p>
          )}
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.05em] px-2 py-1 rounded-full bg-[rgba(220,252,231,0.72)] text-[#16803C] border border-[rgba(22,163,74,0.22)] flex-shrink-0">
            <Check size={11} strokeWidth={3} />
            Checked
          </span>
        )}
      </div>

      {coachFeedback && (
        <div className="glass-well rounded-[12px] p-3 mt-3">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">
            Feedback
          </p>
          <p className="font-body text-[13.5px] text-opac-ink leading-relaxed">
            {coachFeedback}
          </p>
        </div>
      )}

      {coaches.length === 0 ? (
        <p className="font-body text-[12.5px] text-opac-ink-30 mt-3">
          No coaches are set up in the club yet.
        </p>
      ) : (
        <>
          <AnimatePresence initial={false}>
            {picking && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-1 mt-3">
                  {coaches.map((c) => (
                    <button
                      key={c.id}
                      disabled={busy}
                      onClick={() => share(c.id)}
                      className="glass-well rounded-[11px] px-3.5 py-2.5 text-left font-body text-[13.5px] font-semibold text-opac-ink transition-transform duration-200 ease-glide active:scale-[0.99] disabled:opacity-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="font-body text-[12.5px] text-opac-error mt-2">{error}</p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setPicking((v) => !v)}
              disabled={busy}
              className="glass-green sheen relative overflow-hidden flex-1 h-10 rounded-[12px] text-white font-body text-[13.5px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 transition-transform duration-300 ease-glide active:scale-[0.985]"
            >
              <span className="relative z-[1] flex items-center gap-1.5">
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Share2 size={14} />
                )}
                {sharedCoach ? 'Share with someone else' : 'Share with a coach'}
              </span>
            </button>
            {sharedCoach && (
              <button
                onClick={() => share(null)}
                disabled={busy}
                className="glass-card glass-interactive h-10 px-4 rounded-[12px] font-body text-[13.5px] font-semibold text-opac-ink-60 disabled:opacity-60"
              >
                Unshare
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
