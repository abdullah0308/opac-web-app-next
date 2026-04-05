import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Messages — OPAC Admin' }

export default async function AdminMessagesPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const [archersResult, messagesResult] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { and: [{ active: { equals: true } }, { roles: { contains: 'archer' } }] },
      limit: 100,
    }),
    payload.find({
      collection: 'messages',
      where: { or: [{ from: { equals: user.id } }, { to: { equals: user.id } }] },
      sort: '-createdAt',
      limit: 200,
    }),
  ])

  type ArcherDoc = { id: string | number; name?: string; archerId?: string }
  const archers = archersResult.docs as unknown as ArcherDoc[]

  type MsgDoc = {
    id: string | number
    from?: { id?: string | number; name?: string } | string
    to?: { id?: string | number; name?: string } | string
    body?: string
    createdAt?: string
  }

  const conversations = new Map<string, { name: string; lastMsg: MsgDoc }>()
  for (const msg of messagesResult.docs as unknown as MsgDoc[]) {
    const fromId = typeof msg.from === 'object' && msg.from !== null ? String((msg.from as { id?: string | number }).id) : String(msg.from)
    const toId = typeof msg.to === 'object' && msg.to !== null ? String((msg.to as { id?: string | number }).id) : String(msg.to)
    const isFromMe = fromId === String(user.id)
    const partnerId = isFromMe ? toId : fromId
    const partnerName = isFromMe
      ? (typeof msg.to === 'object' && msg.to !== null ? (msg.to as { name?: string }).name : null) ?? 'Archer'
      : (typeof msg.from === 'object' && msg.from !== null ? (msg.from as { name?: string }).name : null) ?? 'Archer'
    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, { name: partnerName, lastMsg: msg })
    }
  }

  const convList = Array.from(conversations.entries())

  return (
    <div className="p-6 flex flex-col gap-5">
      <h1 className="font-display text-[24px] text-opac-ink">Direct Messages</h1>

      {convList.length > 0 && (
        <div>
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-wider mb-2">Recent Conversations</p>
          <div className="flex flex-col gap-2">
            {convList.map(([partnerId, { name, lastMsg }]) => {
              const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              const timeStr = lastMsg.createdAt
                ? new Date(lastMsg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : ''
              return (
                <Link key={partnerId} href={`/admin/messages/${partnerId}`}
                  className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-[12px] text-opac-green">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="font-body text-[14px] font-semibold text-opac-ink">{name}</p>
                      <span className="font-body text-[11px] text-opac-ink-30 flex-shrink-0">{timeStr}</span>
                    </div>
                    <p className="font-body text-[13px] text-opac-ink-60 truncate">{lastMsg.body as string}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-wider mb-2">All Members</p>
        <div className="flex flex-col gap-2">
          {archers.map((a) => {
            const initials = String(a.name ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <Link key={String(a.id)} href={`/admin/messages/${String(a.id)}`}
                className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-[12px] text-opac-green">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[14px] font-semibold text-opac-ink">{a.name}</p>
                  {a.archerId && <p className="font-body text-[12px] text-opac-ink-30">{a.archerId}</p>}
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
