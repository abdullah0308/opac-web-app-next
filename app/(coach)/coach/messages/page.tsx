import Link from 'next/link'
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

  // Fetch all archers for "New Message" picker
  const archersResult = await payload.find({
    collection: 'users',
    where: {
      and: [
        { active: { equals: true } },
        { roles: { contains: 'archer' } },
      ],
    },
    limit: 100,
  })
  type ArcherDoc = { id: string | number; name?: string; archerId?: string }
  const archers = archersResult.docs as unknown as ArcherDoc[]

  // Fetch all messages involving this user
  const messagesResult = await payload.find({
    collection: 'messages',
    where: {
      or: [
        { from: { equals: user.id } },
        { to: { equals: user.id } },
      ],
    },
    sort: '-createdAt',
    limit: 200,
  })

  type MsgDoc = {
    id: string | number
    from?: { id?: string | number; name?: string } | string
    to?: { id?: string | number; name?: string } | string
    body?: string
    createdAt?: string
  }

  // Build conversation list (deduplicated by partner, most recent first)
  const conversations = new Map<string, { name: string; archerId: string | number; lastMsg: MsgDoc; unread: boolean }>()

  for (const msg of messagesResult.docs as unknown as MsgDoc[]) {
    const fromId = typeof msg.from === 'object' && msg.from !== null ? String((msg.from as { id?: string | number }).id) : String(msg.from)
    const toId = typeof msg.to === 'object' && msg.to !== null ? String((msg.to as { id?: string | number }).id) : String(msg.to)
    const isFromMe = fromId === String(user.id)
    const partnerId = isFromMe ? toId : fromId
    const partnerName = isFromMe
      ? (typeof msg.to === 'object' && msg.to !== null ? (msg.to as { name?: string }).name : null) ?? 'Archer'
      : (typeof msg.from === 'object' && msg.from !== null ? (msg.from as { name?: string }).name : null) ?? 'Archer'

    if (!conversations.has(partnerId)) {
      conversations.set(partnerId, { name: partnerName, archerId: partnerId, lastMsg: msg, unread: false })
    }
  }

  const convList = Array.from(conversations.entries())

  return (
    <>
      <ScreenHeader
        title="Messages"
        right={
          <div className="relative group">
            <button className="h-9 px-4 rounded-[10px] bg-opac-green text-white font-body text-[13px] font-semibold flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              New DM
            </button>
            {/* Dropdown of archers */}
            <div className="absolute right-0 top-10 z-20 bg-white border border-opac-border rounded-[12px] shadow-lg w-52 max-h-64 overflow-y-auto hidden group-focus-within:block">
              {archers.map((a) => (
                <Link
                  key={String(a.id)}
                  href={`/coach/messages/${String(a.id)}`}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-opac-surface border-b border-opac-border last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-[10px] text-opac-green">
                      {String(a.name ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-[13px] font-semibold text-opac-ink truncate">{a.name}</p>
                    {a.archerId && <p className="font-body text-[11px] text-opac-ink-30">{a.archerId}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <div className="p-5 flex flex-col gap-2">
        {/* Quick-pick archer list if no conversations */}
        {convList.length === 0 && (
          <>
            <div className="bg-white rounded-[16px] p-5 border border-opac-border text-center mb-2">
              <p className="font-body text-[15px] text-opac-ink-60 mb-3">No messages yet. Start a conversation.</p>
            </div>
            <p className="font-body text-[12px] font-semibold text-opac-ink-30 uppercase tracking-wider px-1 mb-1">All Archers</p>
            {archers.map((a) => {
              const initials = String(a.name ?? '').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <Link
                  key={String(a.id)}
                  href={`/coach/messages/${String(a.id)}`}
                  className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                    <span className="font-display text-[13px] text-opac-green">{initials}</span>
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
          </>
        )}

        {/* Existing conversations */}
        {convList.map(([partnerId, { name, lastMsg }]) => {
          const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          const timeStr = lastMsg.createdAt
            ? new Date(lastMsg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            : ''

          return (
            <Link key={partnerId} href={`/coach/messages/${partnerId}`}
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
            </Link>
          )
        })}
      </div>
    </>
  )
}
