import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Clan Management — OPAC Admin' }

export default async function AdminClansPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const clansResult = await payload.find({
    collection: 'clans',
    sort: 'name',
    limit: 50,
  })
  type ClanDoc = { id: string | number; name?: string; description?: string; color?: string }
  const clans = clansResult.docs as unknown as ClanDoc[]

  // Count members per clan
  const usersResult = await payload.find({
    collection: 'users',
    where: { active: { equals: true } },
    limit: 500,
  })

  type UserDoc = { clanId?: { id?: string | number } | string | null }
  const membersByClan = new Map<string, number>()
  for (const u of usersResult.docs as unknown as UserDoc[]) {
    if (!u.clanId) continue
    const clanId = typeof u.clanId === 'object' && u.clanId !== null
      ? String((u.clanId as { id?: string | number }).id)
      : String(u.clanId)
    membersByClan.set(clanId, (membersByClan.get(clanId) ?? 0) + 1)
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[24px] text-opac-ink">Clans</h1>
        <p className="font-body text-[13px] text-opac-ink-60">{clans.length} clans</p>
      </div>

      {clans.length === 0 ? (
        <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
          <p className="font-body text-[15px] text-opac-ink-60">No clans created yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clans.map((clan) => {
            const memberCount = membersByClan.get(String(clan.id)) ?? 0
            const color = (clan.color as string) || '#2E7D4F'

            return (
              <div key={String(clan.id)} className="bg-white rounded-[16px] p-4 border border-opac-border border-l-[4px]"
                style={{ borderLeftColor: color }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display text-[18px] text-opac-ink">{clan.name ?? 'Unnamed Clan'}</p>
                  <span className="font-body text-[13px] text-opac-ink-60">
                    {memberCount} member{memberCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {clan.description && (
                  <p className="font-body text-[13px] text-opac-ink-60">{clan.description as string}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
