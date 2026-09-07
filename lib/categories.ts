/**
 * Competition classes and standing shapes.
 *
 * Deliberately free of any server import so client components can use it —
 * lib/leaderboard.ts pulls in Payload and must never reach the browser.
 */

export const CATEGORIES = ['beginner', 'intermediate', 'elite', 'compound'] as const
export type Category = (typeof CATEGORIES)[number]

export const CATEGORY_LABEL: Record<Category, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  elite: 'Elite',
  compound: 'Compound',
}

/**
 * Compound shooters form their own class whatever their level; everyone else
 * is split by level.
 */
export function categoryFor(user: {
  bowType?: string | null
  level?: string | null
}): Category {
  if (user.bowType === 'compound') return 'compound'
  const level = user.level
  if (level === 'elite' || level === 'intermediate' || level === 'beginner') return level
  return 'beginner'
}

export interface Standing {
  archerId: string
  archerCode: string
  name: string
  avatarUrl?: string
  category: Category
  clanId: string | null
  clanName: string | null
  clanColour: string | null
  points: number
  sessions: number
  /** Points broken down by where they came from. */
  breakdown: Record<string, number>
  /** 1-based rank inside the archer's own class. */
  rank: number
  qualified: boolean
}

export interface ClanOfficer {
  id: string
  name: string
  avatarUrl?: string
}

export interface ClanStanding {
  id: string
  name: string
  colour: string
  logoUrl?: string
  motto?: string
  points: number
  members: number
  rank: number
  leader: ClanOfficer | null
  coLeader: ClanOfficer | null
}
