'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pin, Lock, Trash2 } from 'lucide-react'

/**
 * Moderation controls for one forum post. Deleting asks for a second click
 * rather than a confirm dialog — a browser confirm is easy to dismiss by
 * reflex, and this cannot be undone.
 */
export function ModerateClient({
  postId,
  pinned,
  locked,
  title,
}: {
  postId: string
  pinned: boolean
  locked: boolean
  title: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function patch(body: Record<string, unknown>) {
    setBusy(true)
    try {
      await fetch('/api/admin/forum', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, ...body }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await fetch('/api/admin/forum', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      setConfirming(false)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => patch({ pinned: !pinned })}
        disabled={busy}
        title={pinned ? 'Unpin this post' : 'Pin this post'}
        aria-label={pinned ? `Unpin ${title}` : `Pin ${title}`}
        className={`w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors disabled:opacity-40 ${
          pinned
            ? 'bg-[rgba(212,160,23,0.18)] text-[#8A6508]'
            : 'glass-well text-opac-ink-30 hover:text-opac-ink'
        }`}
      >
        <Pin size={14} />
      </button>
      <button
        onClick={() => patch({ locked: !locked })}
        disabled={busy}
        title={locked ? 'Unlock replies' : 'Lock replies'}
        aria-label={locked ? `Unlock ${title}` : `Lock ${title}`}
        className={`w-8 h-8 rounded-[9px] flex items-center justify-center transition-colors disabled:opacity-40 ${
          locked
            ? 'bg-[rgba(220,38,38,0.14)] text-opac-error'
            : 'glass-well text-opac-ink-30 hover:text-opac-ink'
        }`}
      >
        <Lock size={14} />
      </button>

      {confirming ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={remove}
            disabled={busy}
            className="h-8 px-3 rounded-[9px] bg-opac-error text-white font-body text-[12px] font-semibold disabled:opacity-50"
          >
            {busy ? 'Removing…' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="h-8 px-2.5 rounded-[9px] glass-well font-body text-[12px] font-semibold text-opac-ink-60"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={busy}
          title="Remove this post"
          aria-label={`Remove ${title}`}
          className="w-8 h-8 rounded-[9px] glass-well flex items-center justify-center text-opac-ink-30 hover:text-opac-error transition-colors disabled:opacity-40"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
