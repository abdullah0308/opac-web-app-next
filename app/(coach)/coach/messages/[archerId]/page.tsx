import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'
import CoachMessageThreadClient from './CoachMessageThreadClient'

export const metadata = { title: 'Message — OPAC Coach' }

export default async function CoachMessageThreadPage({ params }: { params: Promise<{ archerId: string }> }) {
  const { archerId } = await params
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  const [me, partner] = await Promise.all([
    payload.findByID({ collection: 'users', id: userId }).catch(() => null),
    payload.findByID({ collection: 'users', id: archerId }).catch(() => null),
  ])
  if (!me || !partner) notFound()

  // Fetch thread between the two users
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

  type MsgDoc = {
    id: string | number
    from?: { id?: string | number } | string
    body?: string
    createdAt?: string
  }

  const messages = (result.docs as unknown as MsgDoc[]).map((m) => ({
    id: String(m.id),
    fromMe: (typeof m.from === 'object' && m.from !== null
      ? String((m.from as { id?: string | number }).id)
      : String(m.from)) === String(userId),
    body: m.body ?? '',
    time: m.createdAt
      ? new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      : '',
  }))

  const partnerName = (partner.name as string) || 'Archer'

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ScreenHeader title={partnerName} showBack backHref="/coach/messages" />
      <CoachMessageThreadClient
        messages={messages}
        toId={archerId}
        partnerName={partnerName}
      />
    </div>
  )
}
