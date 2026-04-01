'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Clan = { id: string; name: string }

export function AddArcherClient({ clans }: { clans: Clan[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    archerId: '', name: '', email: '', password: '0P@C26',
    bowType: 'recurve', level: 'beginner', gender: 'male',
    clan: clans[0]?.id ?? '', roles: ['archer'] as string[],
  })

  function toggle(role: string) {
    setForm(f => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter(r => r !== role) : [...f.roles, role],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archerId: form.archerId,
          name: form.name,
          email: form.email || `${form.archerId.toLowerCase()}@opac.app`,
          password: form.password,
          bowType: form.bowType,
          level: form.level,
          gender: form.gender,
          clan: form.clan || undefined,
          userRoles: form.roles.length ? form.roles : ['archer'],
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setOpen(false)
      setForm({ archerId: '', name: '', email: '', password: '0P@C26', bowType: 'recurve', level: 'beginner', gender: 'male', clan: clans[0]?.id ?? '', roles: ['archer'] })
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const field = 'w-full h-11 rounded-[10px] border border-opac-border bg-opac-surface px-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green'

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-[10px] bg-opac-green text-white font-body text-[13px] font-semibold flex items-center gap-1.5">
        <span className="text-[16px] leading-none">+</span> Add Archer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-[24px] sm:rounded-[20px] p-6 flex flex-col gap-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-display text-[20px] text-opac-ink">Add Archer</p>
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-opac-surface text-opac-ink-60">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60">Archer ID *</label>
                  <input className={field} placeholder="e.g. AM0033" value={form.archerId}
                    onChange={e => setForm(f => ({ ...f, archerId: e.target.value.toUpperCase() }))} required />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60">Password *</label>
                  <input className={field} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-body text-[12px] font-semibold text-opac-ink-60">Full Name *</label>
                <input className={field} placeholder="Full name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-body text-[12px] font-semibold text-opac-ink-60">Email (optional — auto-generated if blank)</label>
                <input className={field} placeholder={`${(form.archerId || 'id').toLowerCase()}@opac.app`}
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60">Bow</label>
                  <select className={field} value={form.bowType} onChange={e => setForm(f => ({ ...f, bowType: e.target.value }))}>
                    <option value="recurve">Recurve</option>
                    <option value="compound">Compound</option>
                    <option value="barebow">Barebow</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60">Level</label>
                  <select className={field} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60">Gender</label>
                  <select className={field} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              {clans.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[12px] font-semibold text-opac-ink-60">Clan</label>
                  <select className={field} value={form.clan} onChange={e => setForm(f => ({ ...f, clan: e.target.value }))}>
                    <option value="">— No clan —</option>
                    {clans.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-body text-[12px] font-semibold text-opac-ink-60">Roles</label>
                <div className="flex gap-2">
                  {(['archer', 'coach', 'admin'] as const).map(role => (
                    <button key={role} type="button" onClick={() => toggle(role)}
                      className={`flex-1 h-9 rounded-[8px] border font-body text-[13px] font-semibold capitalize transition-all ${
                        form.roles.includes(role) ? 'bg-opac-green text-white border-opac-green' : 'bg-white text-opac-ink-60 border-opac-border'
                      }`}>
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="font-body text-[13px] text-red-500">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold disabled:opacity-50 mt-1">
                {loading ? 'Creating…' : 'Create Archer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
