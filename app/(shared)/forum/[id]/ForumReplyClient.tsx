'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForumReplyClient({ postId }: { postId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/forum/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, body: body.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error ?? 'Failed to post reply')
      }
      setBody('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a reply…"
        rows={3}
        className="w-full rounded-[12px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink resize-none focus:outline-none focus:border-opac-green"
      />
      {error && <p className="font-body text-[13px] text-opac-error">{error}</p>}
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="h-11 rounded-[12px] bg-opac-green text-white font-body text-[14px] font-semibold disabled:opacity-50"
      >
        {loading ? 'Posting…' : 'Reply'}
      </button>
    </form>
  )
}
