import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'
import { categoryFor, CATEGORY_LABEL } from '@/lib/leaderboard'
import PointsClient, { type ArcherOption, type EntryRow } from './PointsClient'

export const metadata = { title: 'Points — OPAC Admin' }

export default async function AdminPointsPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  const settings = (await payload
    .findGlobal({ slug: 'global-settings' })
    .catch(() => null)) as { season?: string; pointsPerAttendance?: number } | null
  const season = settings?.season ?? String(new Date().getFullYear())

  const [archersRes, entriesRes] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { and: [{ active: { equals: true } }, { roles: { contains: 'archer' } }] },
      sort: 'name',
      limit: 500,
      depth: 0,
    }),
    payload.find({
      collection: 'points-entries',
      where: { season: { equals: season } },
      sort: '-date',
      limit: 120,
      depth: 1,
    }),
  ])

  const archers: ArcherOption[] = (
    archersRes.docs as unknown as {
      id: string | number
      name?: string
      archerId?: string
      bowType?: string
      level?: string
    }[]
  ).map((u) => ({
    id: String(u.id),
    name: u.name ?? 'Archer',
    archerCode: u.archerId ?? '',
    category: CATEGORY_LABEL[categoryFor(u)],
  }))

  const entries: EntryRow[] = (
    entriesRes.docs as unknown as {
      id: string | number
      archer?: { id?: string | number; name?: string } | string
      source?: string
      points?: number
      eventName?: string
      date?: string
      batchId?: string
      awardedBy?: { name?: string } | string
    }[]
  ).map((e) => {
    const archerObj =
      e.archer && typeof e.archer === 'object' ? (e.archer as { id?: string | number; name?: string }) : null
    return {
      id: String(e.id),
      archerName: archerObj?.name ?? 'Archer',
      archerId: archerObj?.id ? String(archerObj.id) : String(e.archer ?? ''),
      source: e.source ?? 'other',
      points: e.points ?? 0,
      eventName: e.eventName ?? '',
      date: e.date ?? new Date().toISOString(),
      batchId: e.batchId,
      awardedByName:
        e.awardedBy && typeof e.awardedBy === 'object'
          ? ((e.awardedBy as { name?: string }).name ?? undefined)
          : undefined,
    }
  })

  return (
    <PointsClient
      archers={archers}
      entries={entries}
      season={season}
      pointsPerAttendance={settings?.pointsPerAttendance ?? 1}
    />
  )
}
