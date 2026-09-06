'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Plus, Trash2, X, FileText, Check, AlertTriangle } from 'lucide-react'

export interface ArcherOption {
  id: string
  name: string
  archerCode: string
  category: string
}

export interface EntryRow {
  id: string
  archerName: string
  archerId: string
  source: string
  points: number
  eventName: string
  date: string
  batchId?: string
  awardedByName?: string
}

const SOURCE_LABEL: Record<string, string> = {
  attendance: 'Attendance',
  'pointing-day': 'Pointing day',
  dueling: 'Dueling',
  competition: 'Competition',
  other: 'Other',
}

const SOURCE_TONE: Record<string, string> = {
  attendance: 'bg-[rgba(46,125,79,0.12)] text-opac-green',
  'pointing-day': 'bg-[rgba(212,160,23,0.16)] text-[#8A6508]',
  dueling: 'bg-[rgba(91,33,182,0.12)] text-[#5B21B6]',
  competition: 'bg-[rgba(37,99,235,0.12)] text-[#1D4ED8]',
  other: 'bg-[rgba(26,26,24,0.08)] text-opac-ink-60',
}

const SAMPLE = `archerId,points,source,event,date,note
AM0032,25,competition,Club Championship,2026-09-01,Gold
IB0035,18,competition,Club Championship,2026-09-01,Silver
FL0018,12,pointing-day,Pointing Day September,2026-09-05,`

export default function PointsClient({
  archers,
  entries,
  season,
  pointsPerAttendance,
}: {
  archers: ArcherOption[]
  entries: EntryRow[]
  season: string
  pointsPerAttendance: number
}) {
  const router = useRouter()
  const [showAward, setShowAward] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')

  // Award form
  const [archerId, setArcherId] = useState('')
  const [points, setPoints] = useState('')
  const [source, setSource] = useState('competition')
  const [eventName, setEventName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Upload form
  const [csv, setCsv] = useState('')
  const [rowErrors, setRowErrors] = useState<{ line: number; reason: string }[]>([])
  const [preview, setPreview] = useState<
    { name: string; points: number; source: string }[] | null
  >(null)

  const totals = useMemo(() => {
    const bySource: Record<string, number> = {}
    let sum = 0
    for (const e of entries) {
      bySource[e.source] = (bySource[e.source] ?? 0) + e.points
      sum += e.points
    }
    return { bySource, sum }
  }, [entries])

  function done(msg: string) {
    setFlash(msg)
    setError('')
    router.refresh()
    setTimeout(() => setFlash(''), 4000)
  }

  async function award() {
    if (!archerId) return setError('Pick an archer.')
    if (!points || Number(points) === 0) return setError('Enter a points value.')
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archerId,
          points: Number(points),
          source,
          eventName,
          date,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save')
      setShowAward(false)
      setPoints('')
      setEventName('')
      done('Points awarded.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function upload(dryRun: boolean) {
    if (!csv.trim()) return setError('Paste the sheet first.')
    setBusy(true)
    setError('')
    setRowErrors([])
    if (!dryRun) setPreview(null)
    try {
      const res = await fetch('/api/admin/points/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, dryRun }),
      })
      const data = await res.json()
      if (!res.ok) {
        setRowErrors(data.errors ?? [])
        throw new Error(data.error ?? 'Could not import')
      }
      if (dryRun) {
        setPreview(data.rows)
      } else {
        setShowUpload(false)
        setCsv('')
        setPreview(null)
        done(`Imported ${data.imported} rows — ${data.total} points.`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not import')
    } finally {
      setBusy(false)
    }
  }

  async function remove(entry: EntryRow) {
    setBusy(true)
    try {
      await fetch('/api/admin/points', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id }),
      })
      done('Entry removed.')
    } finally {
      setBusy(false)
    }
  }

  async function removeBatch(batchId: string) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/points', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      })
      const data = await res.json()
      done(`Removed ${data.removed} rows from that upload.`)
    } finally {
      setBusy(false)
    }
  }

  const field =
    'glass-well w-full h-11 rounded-[11px] px-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green transition-colors'

  const batches = useMemo(() => {
    const seen = new Map<string, { count: number; points: number; label: string }>()
    for (const e of entries) {
      if (!e.batchId?.startsWith('sheet:')) continue
      const cur = seen.get(e.batchId) ?? { count: 0, points: 0, label: e.eventName || 'Sheet upload' }
      cur.count += 1
      cur.points += e.points
      seen.set(e.batchId, cur)
    }
    return Array.from(seen.entries())
  }, [entries])

  return (
    <div className="p-6 flex flex-col gap-5 stagger">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[24px] text-opac-ink">Points</h1>
          <p className="font-body text-[13px] text-opac-ink-60">
            Season {season} · {entries.length} entries · {totals.sum} points awarded
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowUpload(true)
              setError('')
            }}
            className="glass-card glass-interactive h-9 px-4 rounded-[11px] font-body text-[13px] font-semibold text-opac-ink flex items-center gap-1.5"
          >
            <Upload size={15} strokeWidth={2} />
            Upload sheet
          </button>
          <button
            onClick={() => {
              setShowAward(true)
              setError('')
            }}
            className="glass-green sheen relative overflow-hidden h-9 px-4 rounded-[11px] text-white font-body text-[13px] font-semibold flex items-center gap-1.5 transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:scale-[0.985]"
          >
            <Plus size={15} strokeWidth={2.4} className="relative z-[1]" />
            <span className="relative z-[1]">Award points</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass-card rounded-[13px] px-4 py-2.5 border-l-[3px] border-l-opac-green flex items-center gap-2"
          >
            <Check size={16} className="text-opac-green" />
            <span className="font-body text-[13.5px] text-opac-ink">{flash}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Where points come from ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {['attendance', 'pointing-day', 'dueling', 'competition', 'other'].map((s) => (
          <div key={s} className="glass-card rounded-[14px] p-3.5">
            <p className="font-mono text-[22px] font-semibold text-opac-ink leading-none">
              {totals.bySource[s] ?? 0}
            </p>
            <p className="font-body text-[11.5px] text-opac-ink-60 mt-1">
              {SOURCE_LABEL[s]}
            </p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-[14px] px-4 py-3 flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-opac-green flex-shrink-0" />
        <p className="font-body text-[13px] text-opac-ink-60">
          Attendance is awarded automatically at{' '}
          <strong className="text-opac-ink font-semibold">
            {pointsPerAttendance} point{pointsPerAttendance === 1 ? '' : 's'}
          </strong>{' '}
          per session. Change the rate in Payload settings.
        </p>
      </div>

      {/* ── Undo a sheet ────────────────────────────────────────────── */}
      {batches.length > 0 && (
        <div>
          <h2 className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.1em] mb-2.5">
            Sheet uploads
          </h2>
          <div className="flex flex-col gap-2">
            {batches.map(([batchId, info]) => (
              <div
                key={batchId}
                className="glass-card rounded-[13px] px-4 py-3 flex items-center gap-3"
              >
                <FileText size={17} className="text-opac-ink-30 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13.5px] font-semibold text-opac-ink truncate">
                    {info.label}
                  </p>
                  <p className="font-body text-[12px] text-opac-ink-60">
                    {info.count} rows · {info.points} points
                  </p>
                </div>
                <button
                  onClick={() => removeBatch(batchId)}
                  disabled={busy}
                  className="font-body text-[12.5px] font-semibold text-opac-error disabled:opacity-50 flex-shrink-0"
                >
                  Undo upload
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Ledger ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.1em] mb-2.5">
          Recent entries
        </h2>
        {entries.length === 0 ? (
          <div className="glass-card rounded-[16px] p-8 text-center">
            <p className="font-body text-[15px] text-opac-ink-60">
              No points recorded this season yet.
            </p>
            <p className="font-body text-[13px] text-opac-ink-30 mt-2">
              Mark someone present, or award event points above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="glass-card rounded-[13px] px-4 py-3 flex items-center gap-3"
              >
                <span
                  className={`text-[10.5px] font-bold uppercase tracking-[0.05em] px-2 py-1 rounded-[5px] flex-shrink-0 ${
                    SOURCE_TONE[e.source] ?? SOURCE_TONE.other
                  }`}
                >
                  {SOURCE_LABEL[e.source] ?? e.source}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[14px] font-semibold text-opac-ink truncate">
                    {e.archerName}
                  </p>
                  <p className="font-body text-[12px] text-opac-ink-60 truncate">
                    {e.eventName || '—'} ·{' '}
                    {new Date(e.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span
                  className={`font-mono text-[16px] font-semibold flex-shrink-0 ${
                    e.points < 0 ? 'text-opac-error' : 'text-opac-green'
                  }`}
                >
                  {e.points > 0 ? '+' : ''}
                  {e.points}
                </span>
                <button
                  onClick={() => remove(e)}
                  disabled={busy}
                  aria-label={`Remove ${e.points} points from ${e.archerName}`}
                  className="w-8 h-8 rounded-[9px] glass-well flex items-center justify-center flex-shrink-0 text-opac-ink-30 hover:text-opac-error transition-colors disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ Award modal ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(15,51,32,0.34)] backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowAward(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              onClick={(ev) => ev.stopPropagation()}
              className="glass w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] shadow-card-lg p-6 flex flex-col gap-3.5 max-h-[92dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[20px] text-opac-ink">Award points</h2>
                <button onClick={() => setShowAward(false)} aria-label="Close">
                  <X size={20} className="text-opac-ink-60" />
                </button>
              </div>

              <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                Archer
                <select
                  value={archerId}
                  onChange={(ev) => setArcherId(ev.target.value)}
                  className={`${field} mt-1.5`}
                >
                  <option value="">Choose…</option>
                  {archers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.archerCode ? `(${a.archerCode})` : ''} — {a.category}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                  Points
                  <input
                    type="number"
                    value={points}
                    onChange={(ev) => setPoints(ev.target.value)}
                    placeholder="25"
                    className={`${field} mt-1.5`}
                  />
                </label>
                <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                  Date
                  <input
                    type="date"
                    value={date}
                    onChange={(ev) => setDate(ev.target.value)}
                    className={`${field} mt-1.5`}
                  />
                </label>
              </div>

              <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                Category
                <select
                  value={source}
                  onChange={(ev) => setSource(ev.target.value)}
                  className={`${field} mt-1.5`}
                >
                  <option value="competition">Competition</option>
                  <option value="pointing-day">Pointing day</option>
                  <option value="dueling">Dueling</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                Event
                <input
                  value={eventName}
                  onChange={(ev) => setEventName(ev.target.value)}
                  placeholder="Club Championship 2026"
                  className={`${field} mt-1.5`}
                />
              </label>

              {error && (
                <p className="font-body text-[12.5px] text-opac-error">{error}</p>
              )}

              <button
                onClick={award}
                disabled={busy}
                className="glass-green sheen relative overflow-hidden w-full h-12 rounded-[13px] text-white font-body text-[15px] font-semibold disabled:opacity-50 transition-transform duration-300 ease-glide active:scale-[0.985]"
              >
                <span className="relative z-[1]">{busy ? 'Saving…' : 'Award points'}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Upload modal ═════════════════════════════════════════════ */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(15,51,32,0.34)] backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              onClick={(ev) => ev.stopPropagation()}
              className="glass w-full sm:max-w-lg rounded-t-[28px] sm:rounded-[24px] shadow-card-lg p-6 flex flex-col gap-3.5 max-h-[92dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[20px] text-opac-ink">Upload a results sheet</h2>
                <button onClick={() => setShowUpload(false)} aria-label="Close">
                  <X size={20} className="text-opac-ink-60" />
                </button>
              </div>

              <p className="font-body text-[13.5px] text-opac-ink-60 leading-relaxed">
                Export the sheet as CSV and paste it below, or pick the file. One row per
                archer: <strong className="text-opac-ink">archer ID, points, category,
                event, date, note</strong>. Only the ID and points are required.
              </p>

              <div className="flex gap-2">
                <label className="glass-card glass-interactive flex-1 h-10 rounded-[11px] flex items-center justify-center gap-2 font-body text-[13px] font-semibold text-opac-ink cursor-pointer">
                  <Upload size={15} />
                  Choose CSV file
                  <input
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                    onChange={async (ev) => {
                      const file = ev.target.files?.[0]
                      if (!file) return
                      setCsv(await file.text())
                      setPreview(null)
                      setRowErrors([])
                      setError('')
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    setCsv(SAMPLE)
                    setPreview(null)
                    setRowErrors([])
                  }}
                  className="glass-card glass-interactive h-10 px-4 rounded-[11px] font-body text-[13px] font-semibold text-opac-ink-60"
                >
                  Use example
                </button>
              </div>

              <textarea
                value={csv}
                onChange={(ev) => {
                  setCsv(ev.target.value)
                  setPreview(null)
                  setRowErrors([])
                }}
                rows={7}
                spellCheck={false}
                placeholder={SAMPLE}
                className="glass-well w-full rounded-[12px] px-3.5 py-3 font-mono text-[12.5px] text-opac-ink resize-y focus:outline-none focus:border-opac-green"
              />

              {rowErrors.length > 0 && (
                <div className="glass-card rounded-[12px] p-3.5 border-l-[3px] border-l-opac-error">
                  <p className="font-body text-[12.5px] font-semibold text-opac-error flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={14} />
                    Nothing was imported — fix these rows first
                  </p>
                  <ul className="flex flex-col gap-1 m-0 p-0 list-none">
                    {rowErrors.map((r) => (
                      <li
                        key={r.line}
                        className="font-mono text-[11.5px] text-opac-ink-60"
                      >
                        Line {r.line}: {r.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview && (
                <div className="glass-card rounded-[12px] p-3.5 border-l-[3px] border-l-opac-green">
                  <p className="font-body text-[12.5px] font-semibold text-opac-green mb-2">
                    {preview.length} rows ready ·{' '}
                    {preview.reduce((s, r) => s + r.points, 0)} points
                  </p>
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {preview.map((r, i) => (
                      <div
                        key={i}
                        className="flex justify-between font-body text-[12.5px] text-opac-ink-60"
                      >
                        <span className="truncate">{r.name}</span>
                        <span className="font-mono flex-shrink-0 ml-3">
                          {r.points > 0 ? '+' : ''}
                          {r.points}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && !rowErrors.length && (
                <p className="font-body text-[12.5px] text-opac-error">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => upload(true)}
                  disabled={busy}
                  className="glass-card glass-interactive flex-1 h-12 rounded-[13px] font-body text-[14px] font-semibold text-opac-ink disabled:opacity-50"
                >
                  {busy ? 'Checking…' : 'Check sheet'}
                </button>
                <button
                  onClick={() => upload(false)}
                  disabled={busy || !preview}
                  title={preview ? undefined : 'Check the sheet first'}
                  className="glass-green sheen relative overflow-hidden flex-1 h-12 rounded-[13px] text-white font-body text-[14px] font-semibold disabled:opacity-40 transition-transform duration-300 ease-glide active:scale-[0.985]"
                >
                  <span className="relative z-[1]">
                    {busy ? 'Importing…' : 'Import points'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
