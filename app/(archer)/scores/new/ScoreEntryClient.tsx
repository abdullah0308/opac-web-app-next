'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Scoring format definitions ────────────────────────────────────────────────

type Format = '300' | '720' | '1440'

const FORMATS: Record<Format, { label: string; ends: number; arrows: number; max: number }> = {
  '300':  { label: '300 Round (Beginner)',  ends: 10, arrows: 3, max: 300  },
  '720':  { label: '720 Round',             ends: 12, arrows: 6, max: 720  },
  '1440': { label: '1440 Round',            ends: 24, arrows: 6, max: 1440 },
}

// Arrow values that can be cycled: M (miss = 0) then 1–10
const CYCLE: Array<number | 'M'> = ['M', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// ── Colour coding per arrow score ─────────────────────────────────────────────

function arrowColour(val: number | 'M'): string {
  if (val === 'M' || val === 0) return 'bg-gray-100 text-gray-400 border border-gray-200'
  if (val === 10)  return 'bg-yellow-300 text-yellow-900 font-bold'
  if (val === 9)   return 'bg-yellow-200 text-yellow-800 font-bold'
  if (val === 8)   return 'bg-red-500 text-white font-bold'
  if (val === 7)   return 'bg-red-300 text-red-900 font-bold'
  if (val === 6)   return 'bg-blue-500 text-white font-bold'
  if (val === 5)   return 'bg-blue-300 text-blue-900 font-bold'
  if (val === 4)   return 'bg-gray-800 text-white font-bold'
  if (val === 3)   return 'bg-gray-600 text-white font-bold'
  if (val === 2)   return 'bg-white text-gray-600 border border-gray-300'
  if (val === 1)   return 'bg-white text-gray-500 border border-gray-200'
  return 'bg-gray-100 text-gray-400'
}

function numericValue(val: number | 'M'): number {
  return val === 'M' ? 0 : val
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = { archerPayloadId: string }

export default function ScoreEntryClient({ archerPayloadId }: Props) {
  const router = useRouter()

  const [format, setFormat] = useState<Format>('300')
  const [roundType, setRoundType] = useState<'training' | 'competition'>('training')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Grid of arrows: ends × arrows, initialised to 'M'
  const [grid, setGrid] = useState<Array<Array<number | 'M'>>>(() =>
    Array.from({ length: FORMATS['300'].ends }, () =>
      Array(FORMATS['300'].arrows).fill('M')
    )
  )

  const fmt = FORMATS[format]

  // Re-initialise grid when format changes
  function changeFormat(f: Format) {
    setFormat(f)
    setGrid(
      Array.from({ length: FORMATS[f].ends }, () =>
        Array(FORMATS[f].arrows).fill('M')
      )
    )
  }

  // Cycle an arrow cell through M → 1 → 2 → … → 10 → M
  function cycleArrow(endIdx: number, arrowIdx: number) {
    setGrid(prev => {
      const next = prev.map(r => [...r])
      const cur = next[endIdx][arrowIdx]
      const idx = CYCLE.indexOf(cur)
      next[endIdx][arrowIdx] = CYCLE[(idx + 1) % CYCLE.length]
      return next
    })
  }

  // Long-press or right-click to go backwards
  function cycleArrowBack(endIdx: number, arrowIdx: number) {
    setGrid(prev => {
      const next = prev.map(r => [...r])
      const cur = next[endIdx][arrowIdx]
      const idx = CYCLE.indexOf(cur)
      next[endIdx][arrowIdx] = CYCLE[(idx - 1 + CYCLE.length) % CYCLE.length]
      return next
    })
  }

  const endTotals = grid.map(end => end.reduce((s: number, v) => s + numericValue(v), 0))
  const grandTotal = endTotals.reduce((s, v) => s + v, 0)

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
          roundType,
          scoringFormat: format,
          points: grandTotal,
          maxPoints: fmt.max,
          roundScores: grid.map(end => end.map(numericValue)),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
      {/* Session type toggle */}
      <div className="flex bg-opac-surface rounded-[10px] p-1">
        {(['training', 'competition'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setRoundType(t)}
            className={`flex-1 h-[38px] rounded-[8px] font-body text-[14px] font-semibold transition-all duration-150 ${
              roundType === t ? 'bg-opac-green text-white' : 'text-opac-ink-60'
            }`}>
            {t === 'training' ? 'Training' : 'Competition'}
          </button>
        ))}
      </div>

      {/* Format selector */}
      <div>
        <p className="font-body text-[13px] font-semibold text-opac-ink mb-2">Scoring Format</p>
        <div className="flex gap-2">
          {(Object.keys(FORMATS) as Format[]).map(f => (
            <button key={f} type="button" onClick={() => changeFormat(f)}
              className={`flex-1 h-10 rounded-[10px] font-body text-[13px] font-semibold border transition-all ${
                format === f
                  ? 'bg-opac-green text-white border-opac-green'
                  : 'bg-white text-opac-ink-60 border-opac-border'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <p className="font-body text-[11px] text-opac-ink-30 mt-1.5">{fmt.label} — {fmt.ends} ends × {fmt.arrows} arrows</p>
      </div>

      {/* Date */}
      <div className="bg-white rounded-[12px] px-4 py-3 border border-opac-border flex items-center gap-2.5">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="4" width="16" height="14" rx="3" stroke="#2E7D4F" strokeWidth="1.5"/>
          <path d="M2 8.5H18M6.5 2.5V5.5M13.5 2.5V5.5" stroke="#2E7D4F" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-body text-[13px] text-opac-ink">{todayFormatted}</span>
      </div>

      {/* Score grid */}
      <div className="bg-white rounded-[14px] border border-opac-border overflow-hidden">
        {/* Header row */}
        <div className={`grid gap-px bg-opac-border text-[10px] font-semibold text-opac-ink-30 uppercase tracking-wider`}
          style={{ gridTemplateColumns: `40px repeat(${fmt.arrows}, 1fr) 44px` }}>
          <div className="bg-opac-surface px-2 py-2 text-center">End</div>
          {Array.from({ length: fmt.arrows }).map((_, i) => (
            <div key={i} className="bg-opac-surface py-2 text-center">{i + 1}</div>
          ))}
          <div className="bg-opac-surface py-2 text-center">Tot</div>
        </div>

        {/* Data rows */}
        {grid.map((end, eIdx) => (
          <div key={eIdx}
            className={`grid gap-px bg-opac-border ${eIdx % 2 === 0 ? '' : ''}`}
            style={{ gridTemplateColumns: `40px repeat(${fmt.arrows}, 1fr) 44px` }}>
            {/* End number */}
            <div className="bg-white flex items-center justify-center">
              <span className="font-mono text-[12px] text-opac-ink-30">{eIdx + 1}</span>
            </div>
            {/* Arrow cells */}
            {end.map((val, aIdx) => (
              <button
                key={aIdx}
                type="button"
                onClick={() => cycleArrow(eIdx, aIdx)}
                onContextMenu={(e) => { e.preventDefault(); cycleArrowBack(eIdx, aIdx) }}
                className={`h-9 flex items-center justify-center font-mono text-[13px] transition-colors active:scale-95 ${arrowColour(val)}`}
              >
                {val === 0 ? 'M' : val}
              </button>
            ))}
            {/* End total */}
            <div className="bg-white flex items-center justify-center">
              <span className={`font-mono text-[13px] font-semibold ${endTotals[eIdx] > 0 ? 'text-opac-ink' : 'text-opac-ink-30'}`}>
                {endTotals[eIdx]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grand total */}
      <div className="bg-white rounded-[16px] px-5 py-4 border border-opac-border shadow-card flex items-center justify-between">
        <div>
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em]">Grand Total</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-mono text-[40px] font-semibold text-opac-green leading-none">{grandTotal}</span>
            <span className="font-mono text-[18px] text-opac-ink-30 leading-none">/ {fmt.max}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[22px] font-semibold text-opac-ink">
            {grandTotal > 0 ? Math.round((grandTotal / fmt.max) * 100) + '%' : '—'}
          </p>
          <p className="font-body text-[11px] text-opac-ink-30 mt-0.5">of max</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-opac-surface overflow-hidden -mt-2">
        <div className="h-full rounded-full bg-opac-green transition-all duration-300"
          style={{ width: `${(grandTotal / fmt.max) * 100}%` }} />
      </div>

      {/* Tap hint */}
      <p className="font-body text-[11px] text-opac-ink-30 text-center">
        Tap a cell to cycle: M → 1 → 2 → … → 10 · Right-tap to go back
      </p>

      {/* Notes */}
      <div>
        <label className="font-body text-[13px] font-semibold text-opac-ink block mb-2">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Wind conditions, equipment notes, etc."
          rows={2}
          className="w-full rounded-[10px] border border-opac-border bg-opac-bg px-3.5 py-3 font-body text-[14px] text-opac-ink resize-none focus:outline-none focus:border-opac-green" />
      </div>

      {error && <p className="font-body text-[13px] text-opac-error">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full h-[52px] rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold hover:bg-[#1A5233] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {loading ? 'Saving…' : `Save Score — ${grandTotal} / ${fmt.max}`}
      </button>
    </form>
  )
}
