import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'
import Link from 'next/link'

export const metadata = { title: 'Coach Dashboard — OPAC' }

export default async function CoachDashboardPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  // Count active archers
  const archersResult = await payload.find({
    collection: 'users',
    where: {
      and: [
        { active: { equals: true } },
        { roles: { contains: 'archer' } },
      ],
    },
    limit: 1,
  })
  const totalArchers = archersResult.totalDocs

  // Today's attendance
  const today = new Date().toISOString().split('T')[0]
  const todayAttResult = await payload.find({
    collection: 'attendance',
    where: {
      and: [
        { timestamp: { greater_than_equal: `${today}T00:00:00.000Z` } },
        { status: { equals: 'present' } },
      ],
    },
    limit: 1,
  })
  const presentToday = todayAttResult.totalDocs

  // Recent scores
  const recentScoresResult = await payload.find({
    collection: 'scores',
    sort: '-createdAt',
    limit: 5,
  })
  const recentScores = recentScoresResult.docs

  // Overdue payments count
  const overdueResult = await payload.find({
    collection: 'payments',
    where: { status: { equals: 'overdue' } },
    limit: 1,
  })
  const overdueCount = overdueResult.totalDocs

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <>
      <ScreenHeader title="Coach" subtitle={todayFormatted} />

      <div className="p-5 flex flex-col gap-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-[16px] p-4 border border-opac-border">
            <p className="font-mono text-[32px] font-semibold text-opac-green">{presentToday}</p>
            <p className="font-body text-[13px] text-opac-ink-60 mt-0.5">Present today</p>
          </div>
          <div className="bg-white rounded-[16px] p-4 border border-opac-border">
            <p className="font-mono text-[32px] font-semibold text-opac-ink">{totalArchers}</p>
            <p className="font-body text-[13px] text-opac-ink-60 mt-0.5">Active archers</p>
          </div>
        </div>

        {overdueCount > 0 && (
          <div className="bg-opac-gold-light rounded-[12px] px-4 py-3 border border-opac-border border-l-[4px] border-l-opac-gold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">⚠️</span>
              <p className="font-body text-[14px] font-semibold text-opac-gold">
                {overdueCount} overdue payment{overdueCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { href: '/coach/archers', label: 'Archers', emoji: '🏹' },
            { href: '/coach/attendance', label: 'Attendance', emoji: '📋' },
          ].map(({ href, label, emoji }) => (
            <Link key={href} href={href}
              className="bg-white rounded-[14px] p-4 border border-opac-border flex items-center gap-3">
              <span className="text-[22px]">{emoji}</span>
              <span className="font-body text-[14px] font-semibold text-opac-ink">{label}</span>
            </Link>
          ))}
        </div>

        {/* Recent scores */}
        {recentScores.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em]">Recent Scores</p>
              <Link href="/coach/archers" className="font-body text-[13px] font-semibold text-opac-green">View all</Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentScores.map((score: { id: string | number; archer?: { name?: string } | string; points?: number; roundType?: string; createdAt?: string }) => {
                const archerName =
                  typeof score.archer === 'object' && score.archer !== null
                    ? (score.archer as { name?: string }).name ?? 'Archer'
                    : 'Archer'
                const initials = archerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                const dateStr = score.createdAt
                  ? new Date(score.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : ''

                return (
                  <div key={score.id} className="bg-white rounded-[14px] px-4 py-3 border border-opac-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                      <span className="font-display text-[12px] text-opac-green">{initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[14px] font-semibold text-opac-ink">{archerName}</p>
                      <p className="font-body text-[12px] text-opac-ink-60">{score.roundType ?? 'Training'} · {dateStr}</p>
                    </div>
                    <span className="font-mono text-[18px] font-semibold text-opac-green">{score.points ?? '—'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
