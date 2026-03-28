'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { archerPayloadId: string }

export default function ScoreEntryClient({ archerPayloadId }: Props) {
  const router = useRouter()
  const [score, setScore] = useState(0)
  const [maxPoints] = useState(300)
  const [roundType, setRoundType] = useState<'training' | 'competition'>('training')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payload/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archer: archerPayloadId,
          points: score,
          maxPoints,
          roundType,
          notes: notes || undefined,
          date: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.errors?.[0]?.message ?? 'Failed to save score')
      }

      router.push('/scores')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
      {/* Session type toggle */}
      <div className="flex bg-opac-surface rounded-[10px] p-1">
        {(['training', 'competition'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setRoundType(t)}
            className={`flex-1 h-[38px] rounded-[8px] font-body text-[14px] font-semibold transition-all duration-150 ${
              roundType === t ? 'bg-opac-green text-white' : 'text-opac-ink-60'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Date display */}
      <div className="bg-white rounded-[12px] px-4 py-3 border border-opac-border flex items-center gap-2.5">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="16" height="14" rx="3" stroke="#2E7D4F" strokeWidth="1.5"/>
          <path d="M2 8.5H18M6.5 2.5V5.5M13.5 2.5V5.5" stroke="#2E7D4F" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-body text-[14px] text-opac-ink">{todayFormatted}</span>
      </div>

      {/* Score hero */}
      <div className="bg-white rounded-[20px] py-7 px-5 border border-opac-border shadow-card flex flex-col items-center gap-5">
        <p className="font-body text-[13px] font-semibold text-opac-ink-60 uppercase tracking-[0.07em]">Total Score</p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setScore(s => Math.max(0, s - 1))}
            className="w-12 h-12 rounded-full border border-opac-border bg-opac-surface flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13" stroke="#1A1A18" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-[64px] font-semibold text-opac-green leading-none">{score}</span>
              <span className="font-mono text-[24px] text-opac-ink-30 leading-none">/{maxPoints}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScore(s => Math.min(maxPoints, s + 1))}
            className="w-12 h-12 rounded-full border border-opac-green bg-opac-green-light flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3V13M3 8H13" stroke="#2E7D4F" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="w-full h-1.5 rounded-full bg-opac-surface overflow-hidden">
          <div
            className="h-full rounded-full bg-opac-green transition-all duration-200"
            style={{ width: `${(score / maxPoints) * 100}%` }}
          />
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="font-mono text-[16px] font-semibold text-opac-ink capitalize">{roundType}</p>
            <p className="font-body text-[11px] text-opac-ink-30 mt-0.5">Type</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[16px] font-semibold text-opac-ink">{maxPoints}</p>
            <p className="font-body text-[11px] text-opac-ink-30 mt-0.5">Max</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[16px] font-semibold text-opac-ink">
              {score > 0 ? Math.round((score / maxPoints) * 100) + '%' : '—'}
            </p>
            <p className="font-body text-[11px] text-opac-ink-30 mt-0.5">Pct</p>
          </div>
        </div>
      </div>

      {/* Max score input */}
      <div>
        <label className="font-body text-[13px] font-semibold text-opac-ink block mb-2">Max possible score</label>
        <input
          type="number"
          value={maxPoints}
          readOnly
          className="w-full h-12 rounded-[10px] border border-opac-border bg-opac-bg px-3.5 font-mono text-[15px] text-opac-ink focus:outline-none cursor-default"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="font-body text-[13px] font-semibold text-opac-ink block mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note (optional)"
          rows={3}
          className="w-full rounded-[10px] border border-opac-border bg-opac-bg px-3.5 py-3 font-body text-[14px] text-opac-ink resize-none focus:outline-none focus:border-opac-green"
        />
      </div>

      {error && <p className="font-body text-[13px] text-opac-error">{error}</p>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold transition-colors hover:bg-[#1A5233] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving…' : 'Save Score'}
        </button>
      </div>
    </form>
  )
}
