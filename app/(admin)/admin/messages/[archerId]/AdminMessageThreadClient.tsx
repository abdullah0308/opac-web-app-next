'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Message = { id: string; fromMe: boolean; body: string; time: string }

function formatMsgTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  if (isToday) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (isYesterday) return `Yesterday ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
type Props = { messages: Message[]; toId: string; partnerName: string }

export default function AdminMessageThreadClient({ messages: initialMessages, toId, partnerName }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toId, body: body.trim() }),
      })
      if (res.ok) {
          setMessages(prev => [...prev, { id: Date.now().toString(), fromMe: true, body: body.trim(), time: new Date().toISOString() }])
        setBody('')
        router.refresh()
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center font-body text-[14px] text-opac-ink-60 mt-8">
            Start a conversation with {partnerName}.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] rounded-[16px] px-4 py-2.5 ${
              msg.fromMe
                ? 'bg-opac-green text-white rounded-br-[4px]'
                : 'bg-white border border-opac-border text-opac-ink rounded-bl-[4px]'
            }`}>
              <p className="font-body text-[14px] leading-snug">{msg.body}</p>
              <p className={`font-body text-[10px] mt-1 text-right ${msg.fromMe ? 'text-[rgba(255,255,255,0.6)]' : 'text-opac-ink-30'}`}>
                {formatMsgTime(msg.time)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-opac-border bg-white px-4 py-3 flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 rounded-[12px] border border-opac-border bg-opac-surface px-3.5 py-2.5 font-body text-[14px] text-opac-ink resize-none focus:outline-none focus:border-opac-green max-h-32"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="w-10 h-10 rounded-full bg-opac-green flex items-center justify-center flex-shrink-0 disabled:opacity-40"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 9L15 9M15 9L10 4M15 9L10 14" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  )
}
