'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Format = '300' | '720' | '1440'

const FORMATS: Record<Format, { label: string; ends: number; arrows: number; max: number }> = {
  '300':  { label: '300 Round',  ends: 10, arrows: 3, max: 300  },
  '720':  { label: '720 Round',  ends: 12, arrows: 6, max: 720  },
  '1440': { label: '1440 Round', ends: 24, arrows: 6, max: 1440 },
}

const DISTANCES = [18, 25, 30, 40, 50, 60, 70, 90]

// Arrow value type: 'X' counts as 10 (gold), 'M' counts as 0
type ArrowVal = 'X' | 'M' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

function toNumeric(v: ArrowVal): number {
  if (v === 'M') return 0
  if (v === 'X') return 10
  return v
}

function isGold(v: ArrowVal): boolean {
  return v === 'X' || v === 10 || v === 9
}

// Colour for a filled arrow chip in the end row
function chipColour(v: ArrowVal): string {
  if (v === 'X' || v === 10 || v === 9) return 'bg-yellow-400 text-yellow-900'
  if (v === 8 || v === 7) return 'bg-red-500 text-white'
  if (v === 6 || v === 5) return 'bg-blue-500 text-white'
  if (v === 4 || v === 3) return 'bg-[#111] text-white'
  if (v === 2 || v === 1) return 'bg-[#e5e7eb] text-[#111]'
  return 'bg-[#374151] text-[#9ca3af]' // M
}

// Keypad button style
function keyColour(v: ArrowVal | '←' | 'Next End'): string {
  if (v === 'X' || v === 10 || v === 9) return 'bg-yellow-400 text-yellow-900 font-bold'
  if (v === 8 || v === 7) return 'bg-red-500 text-white font-bold'
  if (v === 6 || v === 5) return 'bg-blue-500 text-white font-bold'
  if (v === 4 || v === 3) return 'bg-[#1f2937] text-white font-bold'
  if (v === 2 || v === 1) return 'bg-[#e5e7eb] text-[#111] font-bold'
  if (v === 'M') return 'bg-[#16a34a] text-white font-bold'
  if (v === '←') return 'bg-[#374151] text-white'
  return 'bg-transparent border border-[#6b7280] text-[#e5e7eb]' // Next End
}

type Phase = 'setup' | 'entry'

type Props = { archerPayloadId: string; level?: string }

export default function ScoreEntryClient({ archerPayloadId, level = 'beginner' }: Props) {
  const router = useRouter()

  const isAdvanced = level === 'intermediate' || level === 'elite'
  const availableFormats = (Object.keys(FORMATS) as Format[]).filter(f => !(f === '300' && isAdvanced))

  const [phase, setPhase] = useState<Phase>('setup')
  const [format, setFormat] = useState<Format>(isAdvanced ? '720' : '300')
  const [roundType, setRoundType] = useState<'training' | 'competition'>('training')
  const [distance, setDistance] = useState<number | null>(null)

  // Grid: ends × arrows, each cell is ArrowVal or null (unfilled)
  const [grid, setGrid] = useState<Array<Array<ArrowVal | null>>>([])
  const [activeEnd, setActiveEnd] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fmt = FORMATS[format]

  function startEntry() {
    if (!distance) return
    setGrid(Array.from({ length: fmt.ends }, () => Array(fmt.arrows).fill(null)))
    setActiveEnd(0)
    setPhase('entry')
  }

  // How many arrows are filled in the active end
  function filledCount(endIdx: number): number {
    return grid[endIdx]?.filter(v => v !== null).length ?? 0
  }

  function handleKey(val: ArrowVal | '←' | 'Next End') {
    if (val === 'Next End') {
      if (activeEnd < fmt.ends - 1) setActiveEnd(e => e + 1)
      return
    }
    if (val === '←') {
      setGrid(prev => {
        const next = prev.map(r => [...r])
        const row = next[activeEnd]
        // Find last filled slot
        for (let i = row.length - 1; i >= 0; i--) {
          if (row[i] !== null) { row[i] = null; break }
        }
        return next
      })
      return
    }
    // Arrow value
    setGrid(prev => {
      const next = prev.map(r => [...r])
      const row = next[activeEnd]
      const emptyIdx = row.findIndex(v => v === null)
      if (emptyIdx !== -1) {
        row[emptyIdx] = val
        // Auto-advance to next end when full
        if (emptyIdx === row.length - 1 && activeEnd < fmt.ends - 1) {
          setTimeout(() => setActiveEnd(e => e + 1), 150)
        }
      }
      return next
    })
  }

  // Derived stats
  const endTotals = grid.map(end => end.reduce((s, v) => s + (v !== null ? toNumeric(v) : 0), 0))
  const grandTotal = endTotals.reduce((s, v) => s + v, 0)
  const filledArrows = grid.flat().filter(v => v !== null).length
  const avg = filledArrows > 0 ? (grandTotal / filledArrows).toFixed(1) : '0.0'
  const golds = grid.flat().filter(v => v !== null && isGold(v)).length

  async function handleSubmit() {
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
          distance,
          roundScores: grid.map(end => end.map(v => v !== null ? toNumeric(v) : 0)),
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

  // ── Setup phase ────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-opac-border px-5 py-3 flex items-center gap-3">
          <a href="/scores"
            className="w-9 h-9 rounded-[10px] bg-opac-surface border border-opac-border flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="#1A2B1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <p className="font-display text-[20px] text-opac-ink">Add Score</p>
        </div>
      <div className="flex flex-col gap-5 p-5">
        {/* Round type */}
        <div>
          <p className="font-body text-[13px] font-semibold text-opac-ink mb-2">Round Type</p>
          <div className="flex bg-opac-surface rounded-[10px] p-1">
            {(['training', 'competition'] as const).map(t => (
              <button key={t} type="button" onClick={() => setRoundType(t)}
                className={`flex-1 h-[38px] rounded-[8px] font-body text-[14px] font-semibold transition-all ${
                  roundType === t ? 'bg-opac-green text-white' : 'text-opac-ink-60'
                }`}>
                {t === 'training' ? 'Training' : 'Competition'}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <p className="font-body text-[13px] font-semibold text-opac-ink mb-2">Scoring Format</p>
          <div className="flex flex-col gap-2">
            {availableFormats.map(key => {
              const f = FORMATS[key]
              return (
                <button key={key} type="button" onClick={() => setFormat(key)}
                  className={`w-full h-14 rounded-[12px] border font-body text-[14px] font-semibold flex items-center justify-between px-4 transition-all ${
                    format === key
                      ? 'bg-opac-green text-white border-opac-green'
                      : 'bg-white text-opac-ink border-opac-border'
                  }`}>
                  <span>{f.label}</span>
                  <span className={`text-[12px] font-normal ${format === key ? 'text-[rgba(255,255,255,0.7)]' : 'text-opac-ink-30'}`}>
                    {f.ends} ends × {f.arrows} arrows
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Distance */}
        <div>
          <p className="font-body text-[13px] font-semibold text-opac-ink mb-2">Distance</p>
          <div className="flex flex-wrap gap-2">
            {DISTANCES.map(d => (
              <button key={d} type="button" onClick={() => setDistance(d)}
                className={`h-10 px-4 rounded-[10px] border font-body text-[14px] font-semibold transition-all ${
                  distance === d
                    ? 'bg-opac-green text-white border-opac-green'
                    : 'bg-white text-opac-ink border-opac-border'
                }`}>
                {d}m
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={startEntry} disabled={!distance}
          className="w-full h-14 rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold mt-2 disabled:opacity-40">
          Start Scoring →
        </button>
      </div>
      </div>
    )
  }

  // ── Entry phase (dark WA keypad UI) ───────────────────────────────────────

  const KEYPAD: Array<Array<ArrowVal | '←' | 'Next End'>> = [
    ['X', 10, 9, 8, '←'],
    [7, 6, 5, 4, 'Next End'],
    [3, 2, 1, 'M'],
  ]

  return (
    <div className="flex flex-col h-full bg-[#111] text-white">

      {/* ── Top stats bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
        <span className="font-body text-[13px] text-[#9ca3af]">Distance: {distance}m</span>
        <span className="flex-1" />
        <span className="bg-yellow-400 text-yellow-900 font-bold text-[12px] px-3 py-1 rounded-full">
          Golds: {golds}
        </span>
        <span className="font-body text-[13px] text-[#9ca3af]">Avg: {avg}</span>
        <span className="font-body text-[13px] text-[#9ca3af]">Total: {grandTotal}</span>
      </div>

      {/* ── End rows (scrollable middle) ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {grid.map((end, eIdx) => {
          const isActive = eIdx === activeEnd
          const endTotal = endTotals[eIdx]
          return (
            <button
              key={eIdx}
              type="button"
              onClick={() => setActiveEnd(eIdx)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#1f2937] text-left transition-colors ${
                isActive ? 'border-l-4 border-l-amber-500 bg-[#1a1a1a]' : 'border-l-4 border-l-transparent'
              }`}
            >
              <span className="font-body text-[13px] text-[#6b7280] w-5 flex-shrink-0">{eIdx + 1}.</span>
              <div className="flex gap-1.5 flex-1">
                {end.map((val, aIdx) => (
                  <span key={aIdx}
                    className={`w-8 h-8 rounded-md text-[13px] font-bold flex items-center justify-center flex-shrink-0 ${
                      val !== null ? chipColour(val) : 'bg-[#1f2937] text-[#374151]'
                    }`}>
                    {val !== null ? String(val) : '·'}
                  </span>
                ))}
              </div>
              <span className={`font-mono text-[13px] w-7 text-right flex-shrink-0 ${endTotal > 0 ? 'text-white' : 'text-[#374151]'}`}>
                {endTotal || ''}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Bottom stats + keypad ────────────────────────────────────── */}
      <div className="border-t border-[#2a2a2a] bg-[#0d0d0d]">
        {/* Stats row */}
        <div className="flex items-center px-4 py-2.5">
          <span className="font-body text-[13px] text-[#9ca3af]">Average: {avg}</span>
          <div className="flex-1" />
          <span className="bg-[#1f2937] border border-[#374151] text-white font-bold text-[13px] px-4 py-1.5 rounded-full">
            Total: {grandTotal}
          </span>
        </div>

        {/* Keypad */}
        <div className="flex flex-col gap-2 px-3 pb-3">
          {KEYPAD.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-2">
              {row.map((val, cIdx) => {
                const isNextEnd = val === 'Next End'
                return (
                  <button
                    key={cIdx}
                    type="button"
                    onClick={() => handleKey(val)}
                    className={`h-14 rounded-[12px] font-body text-[18px] flex items-center justify-center transition-all active:scale-95 ${
                      isNextEnd ? 'flex-1 text-[14px] font-semibold' : 'flex-1'
                    } ${keyColour(val)}`}
                  >
                    {String(val)}
                  </button>
                )
              })}
            </div>
          ))}

          {error && <p className="font-body text-[13px] text-red-400 text-center mt-1">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || grandTotal === 0}
            className="w-full h-12 rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold mt-1 disabled:opacity-40"
          >
            {loading ? 'Saving…' : `Save — ${grandTotal} / ${fmt.max}`}
          </button>
        </div>
      </div>
    </div>
  )
}
