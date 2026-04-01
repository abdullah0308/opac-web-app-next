import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import ScoreEntryClient from './ScoreEntryClient'

export const metadata = { title: 'Add Score — OPAC' }

export default async function ScoreNewPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  return <ScoreEntryClient archerPayloadId={String(user.id)} />
}
