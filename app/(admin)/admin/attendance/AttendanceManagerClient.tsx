'use client'

import { useState } from 'react'

type Session = { id: string; name: string; date: string; active: boolean; presentIds: string[] }
type Archer = { id: string; name: string; archerId: string }

export default function AttendanceManagerClient({ sessions, archers }: { sessions: Session[]; archers: Archer[] }) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(sessions[0] ?? null)
  const [presentIds, setPresentIds] = useState<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const s of sessions) map[s.id] = [...s.presentIds]
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0])
  const [createError, setCreateError] = useState('')
  const [localSessions, setLocalSessions] = useState(sessions)

  const currentPresent = selectedSession ? (presentIds[selectedSession.id] ?? []) : []

  async function toggleAttendance(archerId: string) {
    if (!selectedSession) return
    const sid = selectedSession.id
    const isPresent = presentIds[sid]?.includes(archerId)
    setSaving(archerId)
    try {
      if (isPresent) {
        // Mark absent — find and delete attendance record
        await fetch('/api/admin/attendance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, archerId }),
        })
        setPresentIds(prev => ({ ...prev, [sid]: (prev[sid] ?? []).filter(id => id !== archerId) }))
      } else {
        // Mark present — create attendance record
        await fetch('/api/admin/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sid, archerId }),
        })
        setPresentIds(prev => ({ ...prev, [sid]: [...(prev[sid] ?? []), archerId] }))
      }
    } finally {
      setSaving(null)
    }
  }

  async function handleCreateSession() {
    if (!newSessionName.trim()) { setCreateError('Session name required'); return }
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName.trim(), date: `${newSessionDate}T08:00:00.000Z`, active: true }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      const data = await res.json()
      const newSession: Session = { id: String(data.id), name: newSessionName.trim(), date: `${newSessionDate}T08:00:00.000Z`, active: true, presentIds: [] }
      setLocalSessions(prev => [newSession, ...prev])
      setPresentIds(prev => ({ ...prev, [newSession.id]: [] }))
      setSelectedSession(newSession)
      setNewSessionName('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="font-display text-[24px] text-opac-ink">Attendance</h1>

      {/* Create session */}
      <div className="bg-white rounded-[16px] border border-opac-border p-4">
        <p className="font-body text-[13px] font-semibold text-opac-ink mb-3">New Session</p>
        <div className="flex gap-2 mb-2">
          <input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Session name…"
            className="flex-1 rounded-[10px] border border-opac-border px-3 py-2 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
          />
          <input
            type="date"
            value={newSessionDate}
            onChange={(e) => setNewSessionDate(e.target.value)}
            className="rounded-[10px] border border-opac-border px-3 py-2 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
          />
        </div>
        {createError && <p className="font-body text-[12px] text-red-500 mb-1">{createError}</p>}
        <button
          onClick={handleCreateSession}
          disabled={creating}
          className="w-full h-10 rounded-[10px] bg-opac-green text-white font-body text-[14px] font-semibold disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create Session'}
        </button>
      </div>

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Session list */}
        <div className="md:w-[220px] flex-shrink-0">
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-wider mb-2">Sessions</p>
          <div className="flex flex-col gap-1.5 max-h-[400px] overflow-y-auto">
            {localSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSession(s)}
                className={`w-full text-left px-3 py-2.5 rounded-[10px] border transition-colors ${
                  selectedSession?.id === s.id
                    ? 'bg-opac-green-light border-opac-green'
                    : 'bg-white border-opac-border'
                }`}
              >
                <p className={`font-body text-[13px] font-semibold ${selectedSession?.id === s.id ? 'text-opac-green' : 'text-opac-ink'}`}>{s.name}</p>
                {s.date && (
                  <p className="font-body text-[11px] text-opac-ink-30">
                    {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                )}
                <p className={`font-body text-[11px] mt-0.5 ${selectedSession?.id === s.id ? 'text-opac-green' : 'text-opac-ink-60'}`}>
                  {(presentIds[s.id] ?? s.presentIds).length} present
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Archer attendance for selected session */}
        {selectedSession && (
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-wider">
                Archers — {selectedSession.name}
              </p>
              <span className="font-body text-[12px] text-opac-ink-60">
                {currentPresent.length}/{archers.length} present
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {archers.map((archer) => {
                const isPresent = currentPresent.includes(archer.id)
                const isSaving = saving === archer.id
                return (
                  <button
                    key={archer.id}
                    onClick={() => toggleAttendance(archer.id)}
                    disabled={isSaving}
                    className={`flex items-center gap-3 px-4 py-3 rounded-[12px] border transition-colors text-left ${
                      isPresent
                        ? 'bg-opac-green-light border-opac-green'
                        : 'bg-white border-opac-border'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isPresent ? 'bg-opac-green' : 'bg-opac-surface'}`}>
                      {isPresent ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <span className="font-display text-[10px] text-opac-ink-30">
                          {archer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-body text-[14px] font-semibold ${isPresent ? 'text-opac-green' : 'text-opac-ink'}`}>{archer.name}</p>
                      {archer.archerId && <p className="font-body text-[11px] text-opac-ink-30">{archer.archerId}</p>}
                    </div>
                    {isSaving && (
                      <div className="w-4 h-4 border-2 border-opac-green border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                    {!isSaving && (
                      <span className={`font-body text-[12px] font-semibold ${isPresent ? 'text-opac-green' : 'text-opac-ink-30'}`}>
                        {isPresent ? 'Present' : 'Absent'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
