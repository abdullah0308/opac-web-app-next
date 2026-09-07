'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Upload, Trash2, Loader2 } from 'lucide-react'

export interface ClanRow {
  id: string
  name: string
  colour: string
  logoUrl?: string
  motto?: string
  members: number
  points: number
  leaderId: string | null
  leaderName: string | null
  coLeaderId: string | null
  coLeaderName: string | null
}

export interface MemberOption {
  id: string
  name: string
  archerCode?: string
  clanId: string | null
}

const SWATCHES = [
  '#2E7D4F',
  '#0F3320',
  '#D4A017',
  '#B45309',
  '#2563EB',
  '#7C3AED',
  '#DC2626',
  '#0E7490',
]

export default function ClansClient({
  clans,
  members,
}: {
  clans: ClanRow[]
  members: MemberOption[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<ClanRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [colour, setColour] = useState('#2E7D4F')
  const [motto, setMotto] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [leader, setLeader] = useState('')
  const [coLeader, setCoLeader] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const open = creating || editing !== null

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setName('')
    setColour('#2E7D4F')
    setMotto('')
    setLogoUrl(undefined)
    setLeader('')
    setCoLeader('')
    setError('')
  }

  function startEdit(c: ClanRow) {
    setEditing(c)
    setCreating(false)
    setName(c.name)
    setColour(c.colour)
    setMotto(c.motto ?? '')
    setLogoUrl(c.logoUrl)
    setLeader(c.leaderId ?? '')
    setCoLeader(c.coLeaderId ?? '')
    setError('')
  }

  function close() {
    setCreating(false)
    setEditing(null)
    setError('')
  }

  async function uploadLogo(file: File) {
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'clans')
      const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setLogoUrl(data.url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!name.trim()) return setError('Give the clan a name.')
    if (leader && coLeader && leader === coLeader) {
      return setError('The leader and co-leader must be two different people.')
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/clans', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editing ? { clanId: editing.id } : {}),
          name: name.trim(),
          colour,
          motto,
          logoUrl: logoUrl ?? null,
          leader: leader || null,
          coLeader: coLeader || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not save')
      close()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function remove(c: ClanRow) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/clans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId: c.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not delete')
      close()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'glass-well w-full h-11 rounded-[11px] px-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green'

  // This clan's own members first — that is who a leader almost always is.
  const officerOptions = editing
    ? [...members].sort((a, b) => {
        const aMine = a.clanId === editing.id ? 0 : 1
        const bMine = b.clanId === editing.id ? 0 : 1
        return aMine - bMine || a.name.localeCompare(b.name)
      })
    : members

  return (
    <div className="p-6 flex flex-col gap-5 stagger">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] text-opac-ink">Clans</h1>
          <p className="font-body text-[13px] text-opac-ink-60">
            {clans.length} clan{clans.length === 1 ? '' : 's'} · standings run on member
            points
          </p>
        </div>
        <button
          onClick={startCreate}
          className="glass-green sheen relative overflow-hidden h-9 px-4 rounded-[11px] text-white font-body text-[13px] font-semibold flex items-center gap-1.5 transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:scale-[0.985]"
        >
          <Plus size={15} strokeWidth={2.4} className="relative z-[1]" />
          <span className="relative z-[1]">New clan</span>
        </button>
      </div>

      {clans.length === 0 ? (
        <div className="glass-card rounded-[16px] p-8 text-center">
          <p className="font-body text-[15px] text-opac-ink-60">No clans created yet.</p>
          <p className="font-body text-[13px] text-opac-ink-30 mt-2">
            Create one, then assign members from the Members screen.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clans.map((c) => (
            <button
              key={c.id}
              onClick={() => startEdit(c)}
              className="glass-card glass-interactive rounded-[16px] p-4 flex items-center gap-4 text-left"
              style={{ borderLeft: `3px solid ${c.colour}` }}
            >
              {c.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logoUrl}
                  alt=""
                  className="w-14 h-14 rounded-[14px] object-cover flex-shrink-0 border border-[rgba(255,255,255,0.8)]"
                />
              ) : (
                <span
                  className="w-14 h-14 rounded-[14px] flex items-center justify-center flex-shrink-0 border border-[rgba(255,255,255,0.8)]"
                  style={{ background: c.colour + '26' }}
                  aria-hidden="true"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.1-4.1-1.2-7-4.9-7-9.1V6l7-3z"
                      stroke={c.colour}
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display text-[18px] text-opac-ink truncate">{c.name}</p>
                <p className="font-body text-[13px] text-opac-ink-60 truncate">
                  {c.motto || `${c.members} member${c.members === 1 ? '' : 's'}`}
                </p>
                {c.leaderName ? (
                  <p className="font-body text-[12px] text-opac-ink-60 truncate mt-0.5">
                    <span className="text-opac-gold font-semibold">Leader</span>{' '}
                    {c.leaderName}
                    {c.coLeaderName && (
                      <>
                        {' · '}
                        <span className="text-opac-ink-30 font-semibold">Co</span>{' '}
                        {c.coLeaderName}
                      </>
                    )}
                  </p>
                ) : (
                  <p className="font-body text-[12px] text-opac-ink-30 mt-0.5">
                    No leader set
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-[19px] font-semibold text-opac-green leading-none">
                  {c.points}
                </p>
                <p className="font-body text-[11px] text-opac-ink-30 mt-1">
                  {c.members} member{c.members === 1 ? '' : 's'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[rgba(15,51,32,0.34)] backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={close}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full sm:max-w-md rounded-t-[28px] sm:rounded-[24px] shadow-card-lg p-6 flex flex-col gap-3.5 max-h-[92dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[20px] text-opac-ink">
                  {editing ? 'Edit clan' : 'New clan'}
                </h2>
                <button onClick={close} aria-label="Close">
                  <X size={20} className="text-opac-ink-60" />
                </button>
              </div>

              {/* Crest */}
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="w-20 h-20 rounded-[18px] object-cover flex-shrink-0 border border-[rgba(255,255,255,0.8)]"
                  />
                ) : (
                  <span
                    className="w-20 h-20 rounded-[18px] flex items-center justify-center flex-shrink-0 border border-dashed"
                    style={{ background: colour + '1F', borderColor: colour + '55' }}
                    aria-hidden="true"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.1-4.1-1.2-7-4.9-7-9.1V6l7-3z"
                        stroke={colour}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="glass-card glass-interactive h-10 rounded-[11px] font-body text-[13px] font-semibold text-opac-ink flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {uploading ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Upload size={15} />
                    )}
                    {uploading ? 'Uploading…' : logoUrl ? 'Replace crest' : 'Upload crest'}
                  </button>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl(undefined)}
                      className="font-body text-[12.5px] text-opac-ink-60 hover:text-opac-error transition-colors"
                    >
                      Remove crest
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) uploadLogo(f)
                    }}
                  />
                </div>
              </div>

              <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wolves"
                  className={`${field} mt-1.5`}
                />
              </label>

              <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                Motto
                <input
                  value={motto}
                  onChange={(e) => setMotto(e.target.value)}
                  placeholder="Optional — shown on the clan leaderboard"
                  className={`${field} mt-1.5`}
                />
              </label>

              {/* Leadership. Members of this clan sort to the top, but anyone
                  can be picked — a leader is sometimes assigned before the
                  roster is filled in. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                  Clan leader
                  <select
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    className={`${field} mt-1.5`}
                  >
                    <option value="">Nobody yet</option>
                    {officerOptions.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.id === coLeader}>
                        {m.name}
                        {m.archerCode ? ` (${m.archerCode})` : ''}
                        {editing && m.clanId !== editing.id ? ' — other clan' : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="font-body text-[12.5px] font-semibold text-opac-ink">
                  Co-leader
                  <select
                    value={coLeader}
                    onChange={(e) => setCoLeader(e.target.value)}
                    className={`${field} mt-1.5`}
                  >
                    <option value="">Nobody yet</option>
                    {officerOptions.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.id === leader}>
                        {m.name}
                        {m.archerCode ? ` (${m.archerCode})` : ''}
                        {editing && m.clanId !== editing.id ? ' — other clan' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <p className="font-body text-[12.5px] font-semibold text-opac-ink mb-2">
                  Colour
                </p>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setColour(s)}
                      aria-label={`Use colour ${s}`}
                      className={`w-9 h-9 rounded-[11px] transition-transform duration-200 ease-glide ${
                        colour === s
                          ? 'scale-110 ring-2 ring-offset-2 ring-offset-transparent'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        background: s,
                        boxShadow:
                          colour === s ? `0 0 0 2px #fff, 0 0 0 4px ${s}` : undefined,
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={colour}
                    onChange={(e) => setColour(e.target.value)}
                    aria-label="Custom colour"
                    className="w-9 h-9 rounded-[11px] border border-[rgba(26,26,24,0.12)] bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              {error && <p className="font-body text-[12.5px] text-opac-error">{error}</p>}

              <button
                onClick={save}
                disabled={busy || uploading}
                className="glass-green sheen relative overflow-hidden w-full h-12 rounded-[13px] text-white font-body text-[15px] font-semibold disabled:opacity-50 transition-transform duration-300 ease-glide active:scale-[0.985]"
              >
                <span className="relative z-[1]">
                  {busy ? 'Saving…' : editing ? 'Save changes' : 'Create clan'}
                </span>
              </button>

              {editing && (
                <button
                  onClick={() => remove(editing)}
                  disabled={busy}
                  className="w-full h-11 rounded-[13px] font-body text-[13.5px] font-semibold text-opac-error flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Delete clan
                  {editing.members > 0 && (
                    <span className="font-normal text-opac-ink-60">
                      ({editing.members} member{editing.members === 1 ? '' : 's'} unassigned)
                    </span>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
