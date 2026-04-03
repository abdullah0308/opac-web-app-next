import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
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
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [
    attendanceResult,
    allArchers,
    allScores,
    myScores,
    paymentsResult,
    messagesResult,
  ] = await Promise.all([
    payload.find({
      collection: 'attendance',
      where: { and: [{ archer: { equals: user.id } }, { timestamp: { greater_than_equal: `${today}T00:00:00.000Z` } }] },
      limit: 1,
    }),
    payload.find({
      collection: 'users',
      where: { and: [{ active: { equals: true } }, { roles: { contains: 'archer' } }] },
      limit: 50,
    }),
    payload.find({ collection: 'scores', sort: '-points', limit: 200 }),
    payload.find({ collection: 'scores', where: { archer: { equals: user.id } }, sort: '-date', limit: 30 }),
    payload.find({
      collection: 'payments',
      where: { and: [{ archer: { equals: user.id } }, { status: { in: ['overdue', 'due'] } }] },
    }),
    payload.find({ collection: 'messages', where: { to: { equals: user.id } }, sort: '-createdAt', limit: 1 }),
  ])

  const todayAttendance = attendanceResult.docs[0]

  // Compute leaderboard rank
  type ScoreDoc = { archer: string | { id: string | number } | null; points?: number }
  const bestByArcher = new Map<string, number>()
  for (const s of allScores.docs as unknown as ScoreDoc[]) {
    const aid = typeof s.archer === 'object' && s.archer !== null ? String((s.archer as { id: string | number }).id) : String(s.archer)
    if (!bestByArcher.has(aid) || (s.points ?? 0) > (bestByArcher.get(aid) ?? 0)) {
      bestByArcher.set(aid, s.points ?? 0)
    }
  }
  const myBest = bestByArcher.get(String(user.id)) ?? 0
  const rank = Array.from(bestByArcher.values()).filter(v => v > myBest).length + 1

  // My scores stats
  type MyScore = { points?: number; roundScores?: number[][] | null; date?: string }
  const myScoreDocs = myScores.docs as unknown as MyScore[]
  const totalPoints = myScoreDocs.reduce((s, r) => s + (r.points ?? 0), 0)
  const bestScore = myScoreDocs.length ? Math.max(...myScoreDocs.map(r => r.points ?? 0)) : 0
  const totalArrows = myScoreDocs.reduce((s, r) => {
    const rounds = r.roundScores ?? []
    return s + rounds.flat().length
  }, 0)

  // Last 5 scores for sparkline
  const sparkScores = myScoreDocs.slice(0, 5).map(s => s.points ?? 0).reverse()
  const sparkMax = sparkScores.length ? Math.max(...sparkScores, 1) : 1
  const sparkMin = sparkScores.length ? Math.min(...sparkScores) : 0
  const sparkRange = sparkMax - sparkMin || 1

  // Payments
  type PaymentDoc = { amount?: number; status?: string; description?: string; dueDate?: string }
  const pendingPayments = paymentsResult.docs as unknown as PaymentDoc[]
  const overdueTotal = pendingPayments.reduce((s, p) => s + (p.amount ?? 0), 0)

  // Clan
  const clanName = typeof user.clanId === 'object' && user.clanId !== null
    ? (user.clanId as { name?: string }).name ?? '—'
    : '—'

  const displayName = (user.name as string) || 'Archer'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const archerId = (user.archerId as string | undefined) ?? ''
  const latestMsg = messagesResult.docs[0]

  const todayFormatted = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      {/* Header */}
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
        {/* Today + QR */}
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
              <QRImage archerId={archerId} />
            )}
          </div>
        </div>

        {/* Stats row: Rank / Best / Total */}
        <div className="grid grid-cols-3 gap-2">
          <Link href="/leaderboard" className="bg-white rounded-[16px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[26px] font-semibold text-opac-gold leading-none">#{rank}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Rank</p>
          </Link>
          <Link href="/scores" className="bg-white rounded-[16px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[26px] font-semibold text-opac-green leading-none">{bestScore}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Best score</p>
          </Link>
          <div className="bg-white rounded-[16px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[26px] font-semibold text-opac-ink leading-none">{totalArrows}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Arrows</p>
          </div>
        </div>

        {/* Clan + Level */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-[16px] px-4 py-3 border border-opac-border flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L10 5.5H14L11 8L12.5 12L8 9.5L3.5 12L5 8L2 5.5H6L8 2Z" stroke="#2E7D4F" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="font-body text-[11px] text-opac-ink-30">Clan</p>
              <p className="font-body text-[13px] font-semibold text-opac-ink">{clanName}</p>
            </div>
          </div>
          <div className="bg-white rounded-[16px] px-4 py-3 border border-opac-border flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2C5.2 2 3 4.2 3 7" stroke="#2E7D4F" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M8 2C10.8 2 13 4.2 13 7" stroke="#2E7D4F" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M8 2L13 7L8 12L3 7Z" stroke="#2E7D4F" strokeWidth="1.4" strokeLinejoin="round"/>
              <line x1="5.5" y1="7" x2="10.5" y2="7" stroke="#2E7D4F" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1.5 1.5"/>
            </svg>
            <div>
              <p className="font-body text-[11px] text-opac-ink-30">Level</p>
              <p className="font-body text-[13px] font-semibold text-opac-ink capitalize">{(user.level as string) ?? 'beginner'}</p>
            </div>
          </div>
        </div>

        {/* Score progress sparkline */}
        {sparkScores.length > 1 && (
          <Link href="/scores" className="bg-white rounded-[16px] p-4 border border-opac-border">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-[13px] font-semibold text-opac-ink">Score Progress</p>
              <span className="font-body text-[11px] text-opac-ink-30">Last {sparkScores.length} rounds</span>
            </div>
            <div className="flex items-end gap-1.5 h-10">
              {sparkScores.map((s, i) => {
                const pct = sparkRange > 0 ? ((s - sparkMin) / sparkRange) : 0.5
                const h = Math.max(4, Math.round(pct * 32))
                const isLast = i === sparkScores.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                    <div
                      className={`w-full rounded-t-[3px] ${isLast ? 'bg-opac-green' : 'bg-opac-green-light'}`}
                      style={{ height: h }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-opac-ink-30">{sparkScores[0]}</span>
              <span className="font-mono text-[10px] font-semibold text-opac-green">{sparkScores[sparkScores.length - 1]}</span>
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
                <p className="font-body text-[12px] text-opac-ink-60">
                  {pendingPayments.map(p => p.description).slice(0, 2).join(', ')}
                </p>
              </div>
            </div>
            <span className="font-body text-[13px] font-semibold text-opac-green flex-shrink-0">Rs {overdueTotal.toLocaleString()} →</span>
          </Link>
        )}

        {/* Latest message */}
        {latestMsg && (
          <Link href="/messages" className="bg-white rounded-[16px] p-3.5 border border-opac-border">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-2.5">Message from Coach</p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <span className="font-display text-[12px] text-[#92400E]">
                  {String(typeof latestMsg.from === 'object' && latestMsg.from !== null
                    ? (latestMsg.from as { name?: string }).name ?? 'C'
                    : 'C').charAt(0)}
                </span>
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
          </Link>
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
