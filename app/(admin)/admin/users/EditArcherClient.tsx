'use client'

import { useState } from 'react'

type Clan = { id: string; name: string }
export type Member = { id: string; name: string; archerId?: string }
type Archer = {
  id: string
  name?: string
  archerId?: string
  email?: string
  bowType?: string
  gender?: string
  level?: string
  roles?: string[]
  active?: boolean
  clanId?: string | { id: string | number; name?: string } | null
  guardians?: (string | { id: string | number })[] | null
  hideFinancials?: boolean
}

export function EditArcherClient({
  archer,
  clans,
  members,
}: {
  archer: Archer
  clans: Clan[]
  members: Member[]
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(archer.name ?? '')
  const [bowType, setBowType] = useState(archer.bowType ?? 'recurve')
  const [gender, setGender] = useState(archer.gender ?? 'male')
  const [level, setLevel] = useState(archer.level ?? 'beginner')
  const [clanId, setClanId] = useState(() => {
    if (!archer.clanId) return ''
    if (typeof archer.clanId === 'object' && archer.clanId !== null) return String((archer.clanId as { id: string | number }).id)
    return String(archer.clanId)
  })
  const [roles, setRoles] = useState<string[]>(archer.roles ?? ['archer'])
  const [active, setActive] = useState(archer.active ?? true)
  const [guardians, setGuardians] = useState<string[]>(() =>
    (archer.guardians ?? []).map((g) =>
      typeof g === 'object' && g !== null
        ? String((g as { id: string | number }).id)
        : String(g),
    ),
  )
  const [hideFinancials, setHideFinancials] = useState(archer.hideFinancials ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Password reset — members are admin-created, so recovery runs through admins.
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetNote, setResetNote] = useState('')

  function toggleGuardian(id: string) {
    setGuardians((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    )
  }

  async function handleResetPassword() {
    if (newPassword.length < 8) {
      setResetNote('Use at least 8 characters.')
      return
    }
    setResetting(true)
    setResetNote('')
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: archer.id, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Reset failed')
      setNewPassword('')
      setResetNote(
        data.emailed
          ? 'Password changed. The member has been emailed.'
          : 'Password changed. Tell them the new one — no email was sent.',
      )
    } catch (err) {
      setResetNote(err instanceof Error ? err.message : 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  function toggleRole(role: string) {
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/update-user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: archer.id, name, bowType, gender, level, clanId: clanId || null, roles, active, guardians, hideFinancials }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Update failed')
      }
      setOpen(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[12px] font-semibold text-opac-green border border-opac-green px-2.5 py-1 rounded-[8px] flex-shrink-0"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="glass rounded-t-[28px] shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-opac-border">
              <p className="font-display text-[18px] text-opac-ink">Edit {archer.archerId ?? 'Archer'}</p>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-opac-surface flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3L11 11M11 3L3 11" stroke="#1A2B1A" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-4 p-5">
              {/* Name */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[10px] glass-card px-3.5 py-2.5 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                />
              </div>

              {/* Bow Type */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Bow Type</label>
                <div className="flex gap-2">
                  {['recurve', 'compound'].map(t => (
                    <button key={t} type="button" onClick={() => setBowType(t)}
                      className={`flex-1 h-10 rounded-[10px] border font-body text-[13px] font-semibold capitalize transition-colors ${
                        bowType === t ? 'bg-opac-green text-white border-opac-green' : 'glass-well text-opac-ink border-transparent'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Gender</label>
                <div className="flex gap-2">
                  {['male', 'female'].map(g => (
                    <button key={g} type="button" onClick={() => setGender(g)}
                      className={`flex-1 h-10 rounded-[10px] border font-body text-[13px] font-semibold capitalize transition-colors ${
                        gender === g ? 'bg-opac-green text-white border-opac-green' : 'glass-well text-opac-ink border-transparent'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Level</label>
                <div className="flex gap-2">
                  {['beginner', 'intermediate', 'elite'].map(l => (
                    <button key={l} type="button" onClick={() => setLevel(l)}
                      className={`flex-1 h-10 rounded-[10px] border font-body text-[13px] font-semibold capitalize transition-colors ${
                        level === l ? 'bg-opac-green text-white border-opac-green' : 'glass-well text-opac-ink border-transparent'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clan */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Clan</label>
                <select
                  value={clanId}
                  onChange={(e) => setClanId(e.target.value)}
                  className="w-full rounded-[10px] glass-card px-3.5 py-2.5 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                >
                  <option value="">No clan</option>
                  {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Roles */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Roles</label>
                <div className="flex gap-2 flex-wrap">
                  {['archer', 'coach', 'admin'].map(r => (
                    <button key={r} type="button" onClick={() => toggleRole(r)}
                      className={`px-3.5 py-1.5 rounded-full border font-body text-[13px] font-semibold capitalize transition-colors ${
                        roles.includes(r) ? 'bg-opac-green text-white border-opac-green' : 'glass-well text-opac-ink border-transparent'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] font-semibold text-opac-ink">Active</span>
                <button type="button" onClick={() => setActive(!active)}
                  className={`w-[48px] h-[28px] rounded-full transition-colors relative ${active ? 'bg-opac-green' : 'bg-opac-border'}`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${active ? 'left-[24px]' : 'left-1'}`} />
                </button>
              </div>

              {/* Parents & guardians */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1">
                  Parents &amp; guardians
                </label>
                <p className="font-body text-[12px] text-opac-ink-60 mb-2">
                  They can switch into this archer&rsquo;s view from their own account — for
                  juniors without a phone, and for parents who are members too.
                </p>
                <div className="glass-well rounded-[11px] max-h-40 overflow-y-auto p-1 flex flex-col gap-0.5">
                  {members.filter((m) => m.id !== archer.id).length === 0 ? (
                    <p className="font-body text-[13px] text-opac-ink-30 p-2.5">
                      No other members to choose from.
                    </p>
                  ) : (
                    members
                      .filter((m) => m.id !== archer.id)
                      .map((m) => {
                        const on = guardians.includes(m.id)
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleGuardian(m.id)}
                            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-left transition-colors ${
                              on
                                ? 'bg-[rgba(46,125,79,0.12)]'
                                : 'hover:bg-[rgba(26,26,24,0.04)]'
                            }`}
                          >
                            <span
                              className={`w-[17px] h-[17px] rounded-[5px] border flex items-center justify-center flex-shrink-0 ${
                                on
                                  ? 'bg-opac-green border-opac-green'
                                  : 'border-[rgba(26,26,24,0.22)] bg-white/60'
                              }`}
                            >
                              {on && (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2.5 6.5L5 9L9.5 3.5"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                            <span
                              className={`font-body text-[13.5px] ${
                                on ? 'font-semibold text-opac-green' : 'text-opac-ink'
                              }`}
                            >
                              {m.name}
                            </span>
                            {m.archerId && (
                              <span className="font-mono text-[11px] text-opac-ink-30 ml-auto">
                                {m.archerId}
                              </span>
                            )}
                          </button>
                        )
                      })
                  )}
                </div>
              </div>

              {/* Financial privacy */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-body text-[13px] font-semibold text-opac-ink block">
                    Hide fees from this archer
                  </span>
                  <span className="font-body text-[12px] text-opac-ink-60">
                    Use when a parent pays. Guardians still see everything.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHideFinancials(!hideFinancials)}
                  aria-pressed={hideFinancials}
                  className={`w-[48px] h-[28px] rounded-full transition-colors relative flex-shrink-0 mt-0.5 ${
                    hideFinancials ? 'bg-opac-green' : 'bg-opac-border'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                      hideFinancials ? 'left-[24px]' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Password reset */}
              <div className="glass-well rounded-[12px] p-3.5">
                <p className="font-body text-[13px] font-semibold text-opac-ink mb-1">
                  Reset password
                </p>
                <p className="font-body text-[12px] text-opac-ink-60 mb-2.5">
                  Sets a new password and emails the member to say it changed.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 characters)"
                    autoComplete="off"
                    className="flex-1 rounded-[10px] glass-card px-3 py-2.5 font-body text-[13.5px] text-opac-ink focus:outline-none focus:border-opac-green"
                  />
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={resetting || !newPassword}
                    className="glass-card glass-interactive px-4 rounded-[10px] font-body text-[13px] font-semibold text-opac-ink disabled:opacity-50"
                  >
                    {resetting ? 'Saving…' : 'Reset'}
                  </button>
                </div>
                {resetNote && (
                  <p className="font-body text-[12.5px] text-opac-ink-60 mt-2">
                    {resetNote}
                  </p>
                )}
              </div>

              {error && <p className="font-body text-[13px] text-red-500">{error}</p>}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-12 glass-green rounded-[13px] text-white transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985] font-body text-[15px] font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
