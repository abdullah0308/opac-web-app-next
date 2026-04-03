'use client'

import { useState } from 'react'

type Clan = { id: string; name: string }
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
}

export function EditArcherClient({ archer, clans }: { archer: Archer; clans: Clan[] }) {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        body: JSON.stringify({ id: archer.id, name, bowType, gender, level, clanId: clanId || null, roles, active }),
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
          <div className="bg-white rounded-t-[24px] w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
                  className="w-full rounded-[10px] border border-opac-border bg-white px-3.5 py-2.5 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
                />
              </div>

              {/* Bow Type */}
              <div>
                <label className="font-body text-[13px] font-semibold text-opac-ink block mb-1.5">Bow Type</label>
                <div className="flex gap-2">
                  {['recurve', 'compound'].map(t => (
                    <button key={t} type="button" onClick={() => setBowType(t)}
                      className={`flex-1 h-10 rounded-[10px] border font-body text-[13px] font-semibold capitalize transition-colors ${
                        bowType === t ? 'bg-opac-green text-white border-opac-green' : 'bg-white text-opac-ink border-opac-border'
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
                        gender === g ? 'bg-opac-green text-white border-opac-green' : 'bg-white text-opac-ink border-opac-border'
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
                        level === l ? 'bg-opac-green text-white border-opac-green' : 'bg-white text-opac-ink border-opac-border'
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
                  className="w-full rounded-[10px] border border-opac-border bg-white px-3.5 py-2.5 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
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
                        roles.includes(r) ? 'bg-opac-green text-white border-opac-green' : 'bg-white text-opac-ink border-opac-border'
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

              {error && <p className="font-body text-[13px] text-red-500">{error}</p>}

              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-12 rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold disabled:opacity-50"
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
