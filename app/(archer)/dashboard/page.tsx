import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'
import { QRImage } from '@/components/ui/opac/QRImage'

export const metadata = { title: 'Dashboard — OPAC' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  // Load archer profile
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  // Today's attendance
  const today = new Date().toISOString().split('T')[0]
  const attendanceResult = await payload.find({
    collection: 'attendance',
    where: {
      and: [
        { archer: { equals: user.id } },
        { timestamp: { greater_than_equal: `${today}T00:00:00.000Z` } },
      ],
    },
    limit: 1,
  })
  const todayAttendance = attendanceResult.docs[0]

  // Pathway progress
  const archerPathwayResult = await payload.find({
    collection: 'archer-pathways',
    where: { archer: { equals: user.id } },
    limit: 1,
    sort: '-updatedAt',
  })
  const archerPathway = archerPathwayResult.docs[0] as {
    pathwayStage?: { stageName?: string } | string | null
    completedRequirements?: { completed?: boolean }[]
  } | undefined

  // Outstanding payments
  const paymentsResult = await payload.find({
    collection: 'payments',
    where: {
      and: [
        { archer: { equals: user.id } },
        { status: { in: ['overdue', 'due'] } },
      ],
    },
  })
  type PaymentDoc = { amount?: number }
  const overdueTotal = (paymentsResult.docs as unknown as PaymentDoc[]).reduce(
    (sum, p) => sum + (p.amount ?? 0), 0
  )

  // Latest message
  const messagesResult = await payload.find({
    collection: 'messages',
    where: { to: { equals: user.id } },
    sort: '-createdAt',
    limit: 1,
  })
  const latestMsg = messagesResult.docs[0]

  const displayName = (user.name as string) || 'Archer'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const pathwayName =
    archerPathway && typeof archerPathway.pathwayStage === 'object' && archerPathway.pathwayStage !== null
      ? (archerPathway.pathwayStage as { stageName?: string }).stageName
      : null
  const completedCount = archerPathway?.completedRequirements?.filter((r) => r.completed).length ?? 0
  const totalCount = archerPathway?.completedRequirements?.length ?? 0
  const pathwayProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const archerId = (user.archerId as string | undefined) ?? ''

  return (
    <>
      {/* Dashboard header */}
      <div className="bg-white border-b border-opac-border px-5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
          <span className="font-display text-[14px] text-opac-green">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[13px] text-opac-ink-60">{getGreeting()},</p>
          <p className="font-display text-[20px] text-opac-ink leading-tight truncate">{displayName}</p>
        </div>
        <Link href="/profile" className="w-9 h-9 rounded-[10px] bg-opac-surface flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="8" r="3.5" stroke="#5C5C58" strokeWidth="1.5"/>
            <path d="M3 18C3 14.7 6.1 12 10 12S17 14.7 17 18" stroke="#5C5C58" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Link>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {/* Today's status */}
        <div className="bg-white rounded-[20px] p-5 border border-opac-border shadow-card relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.06]">
            <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="43" stroke="#2E7D4F" strokeWidth="3"/>
              <circle cx="45" cy="45" r="30" stroke="#2E7D4F" strokeWidth="3"/>
              <circle cx="45" cy="45" r="17" stroke="#2E7D4F" strokeWidth="3"/>
              <circle cx="45" cy="45" r="6" fill="#2E7D4F"/>
            </svg>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Today</p>
              <p className="font-body text-[15px] font-semibold text-opac-ink">{todayFormatted}</p>
            </div>
            {todayAttendance ? (
              <div className="bg-[#DCFCE7] border border-[#86EFAC] rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="font-body text-[13px] font-bold text-[#16A34A]">Present</span>
              </div>
            ) : (
              /* Personal QR code for check-in at the range */
              <QRImage archerId={archerId} />
            )}
          </div>
        </div>

        {/* Pathway card */}
        {archerPathway && (
          <Link href="/pathway" className="bg-white rounded-[16px] p-[18px] border border-opac-border border-l-[4px] border-l-opac-gold shadow-card block">
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <p className="font-body text-[11px] font-semibold text-opac-gold uppercase tracking-[0.07em] mb-1">Pathway</p>
                <p className="font-display text-[18px] text-opac-ink">{pathwayName ?? 'In Progress'}</p>
              </div>
              <div className="bg-opac-gold-light rounded-[8px] px-2.5 py-1 border border-[#D4A01730]">
                <span className="font-mono text-[12px] font-semibold text-opac-gold">{pathwayProgress}%</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-opac-surface overflow-hidden mb-1.5">
              <div className="h-full rounded-full bg-opac-green" style={{ width: `${pathwayProgress}%` }} />
            </div>
          </Link>
        )}

        {/* Outstanding payments */}
        {overdueTotal > 0 && (
          <Link href="/payments" className="bg-opac-gold-light rounded-[12px] px-4 py-3.5 border border-opac-border border-l-[4px] border-l-opac-gold flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-[18px]">⚠️</span>
              <div>
                <p className="font-body text-[14px] font-semibold text-opac-gold">Outstanding balance</p>
                <p className="font-body text-[13px] text-opac-ink-60">Rs {overdueTotal.toLocaleString()}</p>
              </div>
            </div>
            <span className="font-body text-[13px] font-semibold text-opac-green">View →</span>
          </Link>
        )}

        {/* Latest message */}
        {latestMsg && (
          <div className="bg-white rounded-[16px] p-3.5 border border-opac-border">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-2.5">Latest Message</p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <span className="font-display text-[12px] text-[#92400E]">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-0.5">
                  <span className="font-body text-[13px] font-semibold text-opac-ink">
                    {typeof latestMsg.from === 'object' && latestMsg.from !== null
                      ? (latestMsg.from as { name?: string }).name ?? 'Coach'
                      : 'Coach'}
                  </span>
                  <span className="font-body text-[11px] text-opac-ink-30">
                    {new Date(latestMsg.createdAt as string).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="font-body text-[13px] text-opac-ink-60 truncate">{latestMsg.body as string}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <Link href="/scores/new"
          className="w-full h-12 rounded-[12px] bg-opac-green text-white font-body text-[14px] font-semibold flex items-center justify-center gap-1.5">
          🎯 Add Score
        </Link>
      </div>
    </>
  )
}
