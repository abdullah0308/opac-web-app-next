'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { authorId: string }

export default function ForumNewPostClient({ authorId }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/forum/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error ?? data?.errors?.[0]?.message ?? 'Failed to create post')
      }
      router.push('/forum')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-opac-border px-5 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-[10px] bg-opac-surface border border-opac-border flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 14L6 9L11 4" stroke="#1A2B1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="font-display text-[20px] text-opac-ink">New Post</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
        <div>
          <label className="font-body text-[13px] font-semibold text-opac-ink block mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full rounded-[10px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink focus:outline-none focus:border-opac-green"
          />
        </div>

        <div>
          <label className="font-body text-[13px] font-semibold text-opac-ink block mb-2">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share details, questions, or updates with the club…"
            rows={6}
            className="w-full rounded-[10px] border border-opac-border bg-white px-3.5 py-3 font-body text-[14px] text-opac-ink resize-none focus:outline-none focus:border-opac-green"
          />
        </div>

        {error && <p className="font-body text-[13px] text-opac-error">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold hover:bg-[#1A5233] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Posting…' : 'Post to Forum'}
        </button>
      </form>
    </>
  )
}
