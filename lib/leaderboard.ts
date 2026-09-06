import { getPayload } from 'payload'
import config from '@payload-config'
import {
  CATEGORIES,
  categoryFor,
  type Category,
  type Standing,
  type ClanStanding,
} from './categories'

/**
 * Leaderboard rules for OPAC.
 *
 * Standings run on points, never on training scores. Points come from two
 * places only: attendance (awarded automatically at the rate in Global
 * Settings) and events an admin enters — pointing day, dueling, competition.
 *
 * An archer competes in one of four classes. Compound shooters form their own
 * class regardless of level; everyone else is split by level. Class is read
 * from the archer's current record, so a promotion moves their whole season.
 */

export {
  CATEGORIES,
  CATEGORY_LABEL,
  categoryFor,
} from './categories'
export type { Category, Standing, ClanStanding } from './categories'

export interface LeaderboardData {
  season: string
  pointsPerAttendance: number
  minimumSessions: number
  clanEnabled: boolean
  byCategory: Record<Category, Standing[]>
  clans: ClanStanding[]
  totalArchers: number
}

function relId(v: unknown): string | null {
  if (v == null) return null
  if (typeof v === 'object') {
    const id = (v as { id?: string | number }).id
    return id == null ? null : String(id)
  }
  return String(v)
}

export async function getLeaderboard(): Promise<LeaderboardData> {
  const payload = await getPayload({ config })

  const settings = (await payload
    .findGlobal({ slug: 'global-settings' })
    .catch(() => null)) as {
    season?: string
    pointsPerAttendance?: number
    minimumSessionsToQualify?: number
    clanLeaderboardEnabled?: boolean
  } | null

  const season = settings?.season ?? String(new Date().getFullYear())
  const pointsPerAttendance = settings?.pointsPerAttendance ?? 1
  const minimumSessions = settings?.minimumSessionsToQualify ?? 0
  const clanEnabled = settings?.clanLeaderboardEnabled !== false

  const [archersRes, pointsRes, attendanceRes, clansRes] = await Promise.all([
    payload.find({
      collection: 'users',
      where: { and: [{ active: { equals: true } }, { roles: { contains: 'archer' } }] },
      limit: 500,
      depth: 1,
    }),
    payload.find({
      collection: 'points-entries',
      where: { season: { equals: season } },
      limit: 5000,
      depth: 0,
    }),
    payload.find({
      collection: 'attendance',
      where: { status: { equals: 'present' } },
      limit: 5000,
      depth: 0,
    }),
    payload.find({ collection: 'clans', limit: 100, depth: 0 }),
  ])

  // ── Sum points and attendance per archer ────────────────────────────────
  const totals = new Map<string, number>()
  const breakdowns = new Map<string, Record<string, number>>()
  for (const row of pointsRes.docs as unknown as {
    archer: unknown
    points?: number
    source?: string
  }[]) {
    const id = relId(row.archer)
    if (!id) continue
    const pts = row.points ?? 0
    totals.set(id, (totals.get(id) ?? 0) + pts)
    const b = breakdowns.get(id) ?? {}
    const src = row.source ?? 'other'
    b[src] = (b[src] ?? 0) + pts
    breakdowns.set(id, b)
  }

  const sessionCounts = new Map<string, number>()
  for (const row of attendanceRes.docs as unknown as { archer: unknown }[]) {
    const id = relId(row.archer)
    if (!id) continue
    sessionCounts.set(id, (sessionCounts.get(id) ?? 0) + 1)
  }

  // ── Build a standing per archer ─────────────────────────────────────────
  const all: Standing[] = (
    archersRes.docs as unknown as {
      id: string | number
      archerId?: string
      name?: string
      avatarUrl?: string
      bowType?: string
      level?: string
      clanId?: unknown
    }[]
  ).map((u) => {
    const id = String(u.id)
    const clan = u.clanId
    const clanObj =
      clan && typeof clan === 'object'
        ? (clan as { id?: string | number; name?: string; colour?: string })
        : null
    const sessions = sessionCounts.get(id) ?? 0
    return {
      archerId: id,
      archerCode: u.archerId ?? '',
      name: u.name ?? 'Archer',
      avatarUrl: u.avatarUrl,
      category: categoryFor(u),
      clanId: relId(clan),
      clanName: clanObj?.name ?? null,
      clanColour: clanObj?.colour ?? null,
      points: totals.get(id) ?? 0,
      sessions,
      breakdown: breakdowns.get(id) ?? {},
      rank: 0,
      qualified: sessions >= minimumSessions,
    }
  })

  // ── Rank inside each class ──────────────────────────────────────────────
  const byCategory = {} as Record<Category, Standing[]>
  for (const cat of CATEGORIES) {
    const rows = all
      .filter((s) => s.category === cat)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
    // Equal points share a rank.
    let lastPoints: number | null = null
    let lastRank = 0
    rows.forEach((row, i) => {
      if (lastPoints !== null && row.points === lastPoints) {
        row.rank = lastRank
      } else {
        row.rank = i + 1
        lastRank = row.rank
        lastPoints = row.points
      }
    })
    byCategory[cat] = rows
  }

  // ── Clan standings ──────────────────────────────────────────────────────
  const clanTotals = new Map<string, { points: number; members: number }>()
  for (const s of all) {
    if (!s.clanId) continue
    const cur = clanTotals.get(s.clanId) ?? { points: 0, members: 0 }
    cur.points += s.points
    cur.members += 1
    clanTotals.set(s.clanId, cur)
  }

  const clans: ClanStanding[] = (
    clansRes.docs as unknown as {
      id: string | number
      name?: string
      colour?: string
      logoUrl?: string
      motto?: string
    }[]
  )
    .map((c) => {
      const agg = clanTotals.get(String(c.id)) ?? { points: 0, members: 0 }
      return {
        id: String(c.id),
        name: c.name ?? 'Clan',
        colour: c.colour ?? '#2E7D4F',
        logoUrl: c.logoUrl,
        motto: c.motto,
        points: agg.points,
        members: agg.members,
        rank: 0,
      }
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  clans.forEach((c, i) => {
    c.rank = i + 1
  })

  return {
    season,
    pointsPerAttendance,
    minimumSessions,
    clanEnabled,
    byCategory,
    clans,
    totalArchers: all.length,
  }
}

/** Points an archer holds this season, with the source breakdown. */
export async function getArcherPoints(archerId: string): Promise<{
  total: number
  breakdown: Record<string, number>
  season: string
}> {
  const payload = await getPayload({ config })
  const settings = (await payload
    .findGlobal({ slug: 'global-settings' })
    .catch(() => null)) as { season?: string } | null
  const season = settings?.season ?? String(new Date().getFullYear())

  const res = await payload.find({
    collection: 'points-entries',
    where: { and: [{ archer: { equals: archerId } }, { season: { equals: season } }] },
    limit: 1000,
    depth: 0,
  })

  let total = 0
  const breakdown: Record<string, number> = {}
  for (const row of res.docs as unknown as { points?: number; source?: string }[]) {
    const pts = row.points ?? 0
    total += pts
    const src = row.source ?? 'other'
    breakdown[src] = (breakdown[src] ?? 0) + pts
  }
  return { total, breakdown, season }
}
