import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { getLeaderboard } from '@/lib/leaderboard'
import ClansClient, { type ClanRow } from './ClansClient'

export const metadata = { title: 'Clan Management — OPAC Admin' }

export default async function AdminClansPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  // Reuse the leaderboard aggregation so admin totals and the public clan
  // standings can never disagree.
  const board = await getLeaderboard()

  const clans: ClanRow[] = board.clans.map((c) => ({
    id: c.id,
    name: c.name,
    colour: c.colour,
    logoUrl: c.logoUrl,
    motto: c.motto,
    members: c.members,
    points: c.points,
  }))

  return <ClansClient clans={clans} />
}
