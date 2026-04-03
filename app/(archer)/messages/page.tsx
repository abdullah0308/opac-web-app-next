import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'
import ArcherMessageThreadClient from './ArcherMessageThreadClient'

export const metadata = { title: 'Messages — OPAC' }

export default async function ArcherMessagesPage({ searchParams }: { searchParams: Promise<{ with?: string }> }) {
  const { with: withId } = await searchParams
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const me = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!me) redirect('/login')

  type MsgDoc = {
    id: string | number
    from?: { id?: string | number; name?: string } | string
    to?: { id?: string | number; name?: string } | string
    body?: string
    createdAt?: string
  }

  // If viewing a specific thread
  if (withId) {
    const [partner, threadResult] = await Promise.all([
      payload.findByID({ collection: 'users', id: withId }).catch(() => null),
      payload.find({
        collection: 'messages',
        where: {
          or: [
            { and: [{ from: { equals: userId } }, { to: { equals: withId } }] },
            { and: [{ from: { equals: withId } }, { to: { equals: userId } }] },
          ],
        },
        sort: 'createdAt',
        limit: 100,
      }),
    ])
    if (!partner) redirect('/messages')

    const messages = (threadResult.docs as unknown as MsgDoc[]).map((m) => ({
      id: String(m.id),
      fromMe: (typeof m.from === 'object' && m.from !== null
        ? String((m.from as { id?: string | number }).id)
        : String(m.from)) === String(userId),
      body: m.body ?? '',
      time: m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '',
    }))

    const partnerName = (partner.name as string) || 'Coach'

    return (
      <div className="h-full flex flex-col overflow-hidden">
        <ScreenHeader title={partnerName} showBack backHref="/messages" />
        <ArcherMessageThreadClient messages={messages} toId={withId} partnerName={partnerName} />
      </div>
    )
  }

  // Conversation list view
  const messagesResult = await payload.find({
    collection: 'messages',
    where: {
      or: [
        { from: { equals: userId } },
        { to: { equals: userId } },
      ],
    },
    sort: '-createdAt',
    limit: 200,
  })

  const conversations = new Map<string, { name: string; lastMsg: MsgDoc }>()
  for (const msg of messagesResult.docs as unknown as MsgDoc[]) {
    const fromId = typeof msg.from === 'object' && msg.from !== null ? String((msg.from as { id?: string | number }).id) : String(msg.from)
    const toId = typeof msg.to === 'object' && msg.to !== null ? String((msg.to as { id?: string | number }).id) : String(msg.to)
    const isFromMe = fromId === String(userId)
    const partnerId = isFromMe ? toId : fromId
    const partnerName = isFromMe
      ? (typeof msg.to === 'object' && msg.to !== null ? (msg.to as { name?: string }).name : null) ?? 'Coach'
      : (typeof msg.from === 'object' && msg.from !== null ? (msg.from as { name?: string }).name : null) ?? 'Coach'

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, { name: partnerName, lastMsg: msg })
    }
  }

  const convList = Array.from(conversations.entries())

  return (
    <>
      <ScreenHeader title="Messages" />

      <div className="p-5 flex flex-col gap-2">
        {convList.length === 0 ? (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No messages yet.</p>
            <p className="font-body text-[13px] text-opac-ink-30 mt-2">Your coach can send you a direct message here.</p>
          </div>
        ) : (
          convList.map(([partnerId, { name, lastMsg }]) => {
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const timeStr = lastMsg.createdAt
              ? new Date(lastMsg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : ''

            return (
              <a key={partnerId} href={`/messages?with=${partnerId}`}
                className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-[13px] text-opac-green">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-body text-[14px] font-semibold text-opac-ink">{name}</p>
                    <span className="font-body text-[11px] text-opac-ink-30 flex-shrink-0">{timeStr}</span>
                  </div>
                  <p className="font-body text-[13px] text-opac-ink-60 truncate">{lastMsg.body as string}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )
          })
        )}
      </div>
    </>
  )
}
