'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

export interface StageOption {
  id: string
  name: string
  requirements: string[]
}

export interface SharedScore {
  id: string
  points: number
  maxPoints?: number
  date: string
  scoringFormat?: string
  notes?: string
  verified: boolean
  coachFeedback?: string
}

interface Props {
  archerId: string
  archerName: string
  stages: StageOption[]
  currentStageId: string | null
  currentCompleted: boolean[]
  currentNotes: string
  sharedScores: SharedScore[]
}

/**
 * The coach's controls on an archer's page: set their pathway stage, tick off
 * requirements, leave notes, and sign off training rounds the archer shared.
 */
export default function CoachToolsClient({
  archerId,
  archerName,
  stages,
  currentStageId,
  currentCompleted,
  currentNotes,
  sharedScores,
}: Props) {
  const router = useRouter()

  const [stageId, setStageId] = useState(currentStageId ?? stages[0]?.id ?? '')
  const [completed, setCompleted] = useState<boolean[]>(currentCompleted)
  const [notes, setNotes] = useState(currentNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [busyScore, setBusyScore] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, string>>({})

  const stage = stages.find((s) => s.id === stageId)
  const reqs = stage?.requirements ?? []
  const doneCount = reqs.filter((_, i) => completed[i]).length
  const progress = reqs.length ? Math.round((doneCount / reqs.length) * 100) : 0

  function pickStage(id: string) {
    setStageId(id)
    // Different stage, different checklist — start it clean.
    if (id !== currentStageId) setCompleted([])
    else setCompleted(currentCompleted)
    setSaved(false)
  }

  function toggle(i: number) {
    setCompleted((prev) => {
      const next = [...prev]
      next[i] = !next[i]
      return next
    })
    setSaved(false)
  }

  async function savePathway() {
    if (!stageId) return setError('Pick a stage first.')
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/coach/pathway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archerId,
          stageId,
          completed: reqs.map((_, i) => Boolean(completed[i])),
          coachNotes: notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save')
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  async function verify(score: SharedScore) {
    setBusyScore(score.id)
    try {
      await fetch('/api/coach/verify-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreId: score.id,
          verified: !score.verified,
          feedback: feedback[score.id] ?? score.coachFeedback ?? '',
        }),
      })
      router.refresh()
    } finally {
      setBusyScore(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Pathway ─────────────────────────────────────────────────── */}
      <div className="glass-card rounded-[18px] p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em]">
              Pathway
            </p>
            <p className="font-display text-[18px] text-opac-ink mt-0.5">
              {stage?.name ?? 'No stage set'}
            </p>
          </div>
          {reqs.length > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="font-mono text-[19px] font-semibold text-opac-green leading-none">
                {progress}%
              </p>
              <p className="font-body text-[11px] text-opac-ink-60 mt-1">
                {doneCount}/{reqs.length}
              </p>
            </div>
          )}
        </div>

        {reqs.length > 0 && (
          <div className="h-2 rounded-full glass-well overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-opac-green"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            />
          </div>
        )}

        <label className="block font-body text-[12.5px] font-semibold text-opac-ink mb-1.5">
          Stage
          <select
            value={stageId}
            onChange={(e) => pickStage(e.target.value)}
            className="glass-well w-full h-11 rounded-[11px] px-3 mt-1.5 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
          >
            <option value="">Choose a stage…</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {reqs.length > 0 && (
          <div className="mt-3.5">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-2">
              Requirements
            </p>
            <div className="flex flex-col gap-1.5">
              {reqs.map((r, i) => {
                const done = Boolean(completed[i])
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    className={`flex items-start gap-2.5 text-left px-3 py-2.5 rounded-[11px] transition-colors duration-200 ${
                      done ? 'bg-[rgba(46,125,79,0.10)]' : 'glass-well'
                    }`}
                  >
                    <span
                      className={`w-[18px] h-[18px] rounded-[6px] border flex items-center justify-center flex-shrink-0 mt-[1px] transition-colors duration-200 ${
                        done
                          ? 'bg-opac-green border-opac-green'
                          : 'border-[rgba(26,26,24,0.22)] bg-white/60'
                      }`}
                    >
                      <AnimatePresence>
                        {done && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                          >
                            <Check size={12} strokeWidth={3} className="text-white" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                    <span
                      className={`font-body text-[13.5px] leading-snug ${
                        done ? 'text-opac-green font-semibold' : 'text-opac-ink'
                      }`}
                    >
                      {r}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <label className="block font-body text-[12.5px] font-semibold text-opac-ink mt-3.5">
          Notes for {archerName.split(' ')[0]}
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value)
              setSaved(false)
            }}
            rows={3}
            placeholder="What to work on before the next session…"
            className="glass-well w-full rounded-[12px] px-3.5 py-2.5 mt-1.5 font-body text-[14px] text-opac-ink resize-y focus:outline-none focus:border-opac-green"
          />
        </label>

        {error && <p className="font-body text-[12.5px] text-opac-error mt-2">{error}</p>}

        <button
          onClick={savePathway}
          disabled={saving}
          className="glass-green sheen relative overflow-hidden w-full h-11 rounded-[13px] mt-3 text-white font-body text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-transform duration-300 ease-glide active:scale-[0.985]"
        >
          <span className="relative z-[1] flex items-center gap-2">
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saved && !saving && <Check size={15} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save pathway'}
          </span>
        </button>
      </div>

      {/* ── Shared training rounds ──────────────────────────────────── */}
      <div>
        <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-2.5">
          Rounds shared with you
        </p>
        {sharedScores.length === 0 ? (
          <div className="glass-card rounded-[16px] p-6 text-center">
            <p className="font-body text-[14px] text-opac-ink-60">
              {archerName.split(' ')[0]} has not shared any training rounds yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sharedScores.map((s) => (
              <div key={s.id} className="glass-card rounded-[14px] p-4">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[22px] font-semibold text-opac-green">
                      {s.points}
                    </span>
                    {s.maxPoints && (
                      <span className="font-mono text-[13px] text-opac-ink-30">
                        /{s.maxPoints}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[12.5px] text-opac-ink-60">
                      {s.scoringFormat ? `${s.scoringFormat} round · ` : ''}
                      {new Date(s.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {s.verified && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.05em] px-2 py-1 rounded-full bg-[rgba(220,252,231,0.72)] text-[#16803C] border border-[rgba(22,163,74,0.22)] flex-shrink-0">
                      <Check size={11} strokeWidth={3} />
                      Checked
                    </span>
                  )}
                </div>

                {s.notes && (
                  <p className="font-body text-[13px] text-opac-ink-60 italic mb-2.5">
                    “{s.notes}”
                  </p>
                )}

                <textarea
                  value={feedback[s.id] ?? s.coachFeedback ?? ''}
                  onChange={(e) =>
                    setFeedback((f) => ({ ...f, [s.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Feedback for this round…"
                  className="glass-well w-full rounded-[11px] px-3 py-2 font-body text-[13.5px] text-opac-ink resize-y focus:outline-none focus:border-opac-green"
                />

                <button
                  onClick={() => verify(s)}
                  disabled={busyScore === s.id}
                  className={`w-full h-10 rounded-[11px] mt-2 font-body text-[13.5px] font-semibold transition-transform duration-200 ease-glide active:scale-[0.985] disabled:opacity-60 ${
                    s.verified
                      ? 'glass-card text-opac-ink-60'
                      : 'glass-green text-white'
                  }`}
                >
                  {busyScore === s.id
                    ? 'Saving…'
                    : s.verified
                      ? 'Undo check · save feedback'
                      : 'Mark checked & send feedback'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
