import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'
import { getLeaderboard } from '@/lib/leaderboard'
import ClansClient, { type ClanRow, type MemberOption } from './ClansClient'

export const metadata = { title: 'Clan Management — OPAC Admin' }

export default async function AdminClansPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  // Reuse the leaderboard aggregation so admin totals and the public clan
  // standings can never disagree.
  const [board, membersRes] = await Promise.all([
    getLeaderboard(),
    payload.find({
      collection: 'users',
      where: { active: { equals: true } },
      sort: 'name',
      limit: 500,
      depth: 0,
    }),
  ])

  const clans: ClanRow[] = board.clans.map((c) => ({
    id: c.id,
    name: c.name,
    colour: c.colour,
    logoUrl: c.logoUrl,
    motto: c.motto,
    members: c.members,
    points: c.points,
    leaderId: c.leader?.id ?? null,
    leaderName: c.leader?.name ?? null,
    coLeaderId: c.coLeader?.id ?? null,
    coLeaderName: c.coLeader?.name ?? null,
  }))

  const members: MemberOption[] = (
    membersRes.docs as unknown as {
      id: string | number
      name?: string
      archerId?: string
      clanId?: unknown
    }[]
  ).map((u) => {
    const clan = u.clanId
    const clanId =
      clan == null
        ? null
        : typeof clan === 'object'
          ? String((clan as { id?: string | number }).id ?? '')
          : String(clan)
    return {
      id: String(u.id),
      name: u.name ?? 'Member',
      archerCode: u.archerId,
      clanId: clanId || null,
    }
  })

  return <ClansClient clans={clans} members={members} />
}
