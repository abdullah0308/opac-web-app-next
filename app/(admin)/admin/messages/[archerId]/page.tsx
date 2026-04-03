import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'
import AdminMessageThreadClient from './AdminMessageThreadClient'

export const metadata = { title: 'Message — OPAC Admin' }

export default async function AdminMessageThreadPage({ params }: { params: Promise<{ archerId: string }> }) {
  const { archerId } = await params
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const [me, partner] = await Promise.all([
    payload.findByID({ collection: 'users', id: userId }).catch(() => null),
    payload.findByID({ collection: 'users', id: archerId }).catch(() => null),
  ])
  if (!me || !partner) notFound()

  const result = await payload.find({
    collection: 'messages',
    where: {
      or: [
        { and: [{ from: { equals: userId } }, { to: { equals: archerId } }] },
        { and: [{ from: { equals: archerId } }, { to: { equals: userId } }] },
      ],
    },
    sort: 'createdAt',
    limit: 100,
  })

  type MsgDoc = { id: string | number; from?: { id?: string | number } | string; body?: string; createdAt?: string }
  const messages = (result.docs as unknown as MsgDoc[]).map((m) => ({
    id: String(m.id),
    fromMe: (typeof m.from === 'object' && m.from !== null
      ? String((m.from as { id?: string | number }).id)
      : String(m.from)) === String(userId),
    body: m.body ?? '',
    time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '',
  }))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-white border-b border-opac-border px-5 py-3 flex items-center gap-3 flex-shrink-0">
        <a href="/admin/messages" className="w-8 h-8 rounded-[8px] bg-opac-surface border border-opac-border flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="#1A2B1A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <p className="font-body text-[16px] font-semibold text-opac-ink">{partner.name as string ?? 'Archer'}</p>
      </div>
      <AdminMessageThreadClient messages={messages} toId={archerId} partnerName={(partner.name as string) ?? 'Archer'} />
    </div>
  )
}
