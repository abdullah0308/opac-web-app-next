import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Messages — OPAC Coach' }

export default async function CoachMessagesPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const messagesResult = await payload.find({
    collection: 'messages',
    where: {
      or: [
        { from: { equals: user.id } },
        { to: { equals: user.id } },
      ],
    },
    sort: '-createdAt',
    limit: 50,
  })
  const messages = messagesResult.docs

  // Group by conversation partner
  type MsgDoc = { id: string | number; from?: { id?: string | number; name?: string } | string; to?: { id?: string | number; name?: string } | string; body?: string; createdAt?: string; read?: boolean }
  const conversations = new Map<string, { name: string; lastMsg: MsgDoc }>()

  for (const msg of messages as MsgDoc[]) {
    const fromId = typeof msg.from === 'object' && msg.from !== null ? String((msg.from as { id?: string | number }).id) : String(msg.from)
    const toId = typeof msg.to === 'object' && msg.to !== null ? String((msg.to as { id?: string | number }).id) : String(msg.to)
    const partnerId = fromId === String(user.id) ? toId : fromId
    const partnerName = fromId === String(user.id)
      ? (typeof msg.to === 'object' && msg.to !== null ? (msg.to as { name?: string }).name : null) ?? 'Archer'
      : (typeof msg.from === 'object' && msg.from !== null ? (msg.from as { name?: string }).name : null) ?? 'Archer'

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
          </div>
        ) : (
          convList.map(([partnerId, { name, lastMsg }]) => {
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            const timeStr = lastMsg.createdAt
              ? new Date(lastMsg.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              : ''

            return (
              <div key={partnerId} className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
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
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
