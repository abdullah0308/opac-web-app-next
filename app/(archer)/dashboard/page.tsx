import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getViewContext } from '@/lib/viewer'
import { getLeaderboard, CATEGORY_LABEL, categoryFor } from '@/lib/leaderboard'
import { QRImage } from '@/components/ui/opac/QRImage'
import { CountUp } from '@/components/ui/opac/CountUp'
import { StatusBadge } from '@/components/ui/opac/StatusBadge'

export const metadata = { title: 'Dashboard — OPAC' }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const SOURCE_LABEL: Record<string, string> = {
  attendance: 'Attendance',
  'pointing-day': 'Pointing day',
  dueling: 'Dueling',
  competition: 'Competition',
  other: 'Other',
}

export default async function DashboardPage() {
  const ctx = await getViewContext()
  if (!ctx) redirect('/login')

  const user = ctx.subject
  const userId = ctx.subjectId

  const payload = await getPayload({ config })
  const today = new Date().toISOString().split('T')[0]

  const [attendanceResult, myScores, paymentsResult, messagesResult, board] =
    await Promise.all([
      payload.find({
        collection: 'attendance',
        where: {
          and: [
            { archer: { equals: userId } },
            { timestamp: { greater_than_equal: `${today}T00:00:00.000Z` } },
          ],
        },
        limit: 1,
      }),
      payload.find({
        collection: 'scores',
        where: { archer: { equals: userId } },
        sort: '-date',
        limit: 30,
      }),
      ctx.canSeeFinancials
        ? payload.find({
            collection: 'payments',
            where: {
              and: [
                { archer: { equals: userId } },
                { status: { in: ['overdue', 'due'] } },
              ],
            },
          })
        : Promise.resolve({ docs: [] }),
      payload.find({
        collection: 'messages',
        where: { to: { equals: userId } },
        sort: '-createdAt',
        limit: 1,
      }),
      getLeaderboard(),
    ])

  const todayAttendance = attendanceResult.docs[0]

  // ── Standing in this archer's own class ─────────────────────────────────
  const category = categoryFor(user)
  const classRows = board.byCategory[category] ?? []
  const me = classRows.find((r) => r.archerId === String(userId))
  const points = me?.points ?? 0
  const rank = me?.rank ?? classRows.length + 1
  const classSize = classRows.length
  const breakdown = me?.breakdown ?? {}
  const topBreakdown = Object.entries(breakdown)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // ── Training log summary (does not feed the leaderboard) ────────────────
  type MyScore = { points?: number; roundScores?: number[][] | null; date?: string }
  const myScoreDocs = myScores.docs as unknown as MyScore[]
  const bestScore = myScoreDocs.length
    ? Math.max(...myScoreDocs.map((r) => r.points ?? 0))
    : 0
  const totalArrows = myScoreDocs.reduce(
    (s, r) => s + (r.roundScores ?? []).flat().length,
    0,
  )
  const sparkScores = myScoreDocs
    .slice(0, 6)
    .map((s) => s.points ?? 0)
    .reverse()
  const sparkMax = sparkScores.length ? Math.max(...sparkScores, 1) : 1
  const sparkMin = sparkScores.length ? Math.min(...sparkScores) : 0
  const sparkRange = sparkMax - sparkMin || 1

  type PaymentDoc = { amount?: number; description?: string }
  const pendingPayments = paymentsResult.docs as unknown as PaymentDoc[]
  const overdueTotal = pendingPayments.reduce((s, p) => s + (p.amount ?? 0), 0)

  const clanName =
    typeof user.clanId === 'object' && user.clanId !== null
      ? ((user.clanId as { name?: string }).name ?? '—')
      : '—'
  const myClan = me?.clanId ? board.clans.find((c) => c.id === me.clanId) : undefined

  const displayName = user.name
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const avatarUrl = user.avatarUrl
  const archerCode = user.archerId ?? ''
  const latestMsg = messagesResult.docs[0]

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      {/* Header */}
      <div className="glass glass-bar sticky top-0 z-30 border-x-0 border-t-0 px-5 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[rgba(212,234,217,0.85)] border border-[rgba(255,255,255,0.8)] shadow-[0_2px_8px_-2px_rgba(15,51,32,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] flex items-center justify-center flex-shrink-0 overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-[14px] text-opac-green">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-body text-[13px] text-opac-ink-60">
            {ctx.isProxy ? `${displayName}'s account` : `${getGreeting()},`}
          </p>
          <p className="font-display text-[20px] text-opac-ink leading-tight truncate">
            {ctx.isProxy ? CATEGORY_LABEL[category] + ' class' : displayName}
          </p>
        </div>
        <Link
          href="/profile"
          className="w-9 h-9 rounded-full overflow-hidden bg-[rgba(212,234,217,0.85)] border border-[rgba(255,255,255,0.8)] shadow-[0_2px_8px_-2px_rgba(15,51,32,0.22)] flex items-center justify-center flex-shrink-0 transition-transform duration-200 ease-glide hover:scale-105 active:scale-95"
          aria-label="Profile"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display text-[12px] text-opac-green">{initials}</span>
          )}
        </Link>
      </div>

      <div className="flex flex-col gap-3 p-5 stagger">
        {/* ── Today + check-in QR ─────────────────────────────────────── */}
        <div className="glass-card rounded-[20px] p-5 relative overflow-hidden">
          <div
            className="absolute right-[-14px] bottom-[-14px] opacity-[0.08] pointer-events-none"
            aria-hidden="true"
          >
            <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
              <circle cx="45" cy="45" r="43" stroke="#2E7D4F" strokeWidth="3" />
              <circle cx="45" cy="45" r="30" stroke="#2E7D4F" strokeWidth="3" />
              <circle cx="45" cy="45" r="17" stroke="#2E7D4F" strokeWidth="3" />
              <circle cx="45" cy="45" r="6" fill="#2E7D4F" />
            </svg>
          </div>
          <div className="flex justify-between items-center gap-3">
            <div className="min-w-0">
              <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">
                Today
              </p>
              <p className="font-body text-[15px] font-semibold text-opac-ink">
                {todayFormatted}
              </p>
              {!todayAttendance && (
                <p className="font-body text-[12px] text-opac-ink-60 mt-1">
                  Tap the code to enlarge it for the scanner.
                </p>
              )}
            </div>
            {todayAttendance ? (
              <StatusBadge variant="present" live className="h-9 px-4 text-[13px]" />
            ) : (
              <QRImage archerId={archerCode} name={displayName} />
            )}
          </div>
        </div>

        {/* ── Season points — the thing the leaderboard runs on ────────── */}
        <Link
          href="/leaderboard"
          className="glass-card glass-interactive rounded-[20px] p-5 relative overflow-hidden sheen"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1.5">
                Season points · {board.season}
              </p>
              <div className="flex items-baseline gap-2">
                <CountUp
                  value={points}
                  className="font-mono text-[38px] font-semibold text-opac-green leading-none"
                />
                <span className="font-body text-[13px] text-opac-ink-60">pts</span>
              </div>
              {topBreakdown.length > 0 && (
                <p className="font-body text-[12px] text-opac-ink-60 mt-2">
                  {topBreakdown
                    .map(([k, v]) => `${SOURCE_LABEL[k] ?? k} ${v}`)
                    .join(' · ')}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="inline-flex flex-col items-center glass-well rounded-[14px] px-3.5 py-2.5">
                <span className="font-mono text-[24px] font-semibold text-opac-gold leading-none">
                  #{rank}
                </span>
                <span className="font-body text-[10px] text-opac-ink-60 mt-1 whitespace-nowrap">
                  of {classSize || 1}
                </span>
              </div>
              <p className="font-body text-[11px] font-semibold text-opac-ink mt-1.5">
                {CATEGORY_LABEL[category]}
              </p>
            </div>
          </div>
          {me && !me.qualified && board.minimumSessions > 0 && (
            <p className="font-body text-[12px] text-opac-gold mt-3 pt-3 border-t glass-divider">
              {board.minimumSessions - me.sessions} more session
              {board.minimumSessions - me.sessions === 1 ? '' : 's'} to qualify for the
              standings.
            </p>
          )}
        </Link>

        {/* ── Clan + class ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/leaderboard?tab=clans"
            className="glass-card glass-interactive rounded-[16px] px-4 py-3 flex items-center gap-2.5"
          >
            {myClan?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={myClan.logoUrl}
                alt=""
                className="w-8 h-8 rounded-[9px] object-cover flex-shrink-0"
              />
            ) : (
              <span
                className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
                style={{ background: (myClan?.colour ?? '#2E7D4F') + '26' }}
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 2L10 5.5H14L11 8L12.5 12L8 9.5L3.5 12L5 8L2 5.5H6L8 2Z"
                    stroke={myClan?.colour ?? '#2E7D4F'}
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            <div className="min-w-0">
              <p className="font-body text-[11px] text-opac-ink-30">
                {myClan?.leader?.id === String(userId)
                  ? 'Clan · you lead'
                  : myClan?.coLeader?.id === String(userId)
                    ? 'Clan · co-leader'
                    : 'Clan'}
              </p>
              <p className="font-body text-[13px] font-semibold text-opac-ink truncate">
                {myClan?.name ?? clanName}
              </p>
            </div>
          </Link>
          <div className="glass-card rounded-[16px] px-4 py-3 flex items-center gap-2.5">
            <span
              className="w-8 h-8 rounded-[9px] bg-[rgba(46,125,79,0.12)] flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 2L13 7L8 12L3 7Z"
                  stroke="#2E7D4F"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <line
                  x1="5.5"
                  y1="7"
                  x2="10.5"
                  y2="7"
                  stroke="#2E7D4F"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeDasharray="1.5 1.5"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-body text-[11px] text-opac-ink-30">Class</p>
              <p className="font-body text-[13px] font-semibold text-opac-ink truncate">
                {CATEGORY_LABEL[category]}
              </p>
            </div>
          </div>
        </div>

        {/* ── Training log ─────────────────────────────────────────────── */}
        <div className="glass-card rounded-[18px] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-body text-[13px] font-semibold text-opac-ink">
                Training log
              </p>
              <p className="font-body text-[11px] text-opac-ink-30 mt-0.5">
                Personal practice — not counted on the leaderboard
              </p>
            </div>
            <Link
              href="/scores"
              className="font-body text-[13px] font-semibold text-opac-green flex-shrink-0"
            >
              All rounds →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="glass-well rounded-[13px] p-3 text-center">
              <CountUp
                value={bestScore}
                className="font-mono text-[22px] font-semibold text-opac-green leading-none block"
              />
              <p className="font-body text-[11px] text-opac-ink-60 mt-1">Best round</p>
            </div>
            <div className="glass-well rounded-[13px] p-3 text-center">
              <CountUp
                value={totalArrows}
                className="font-mono text-[22px] font-semibold text-opac-ink leading-none block"
              />
              <p className="font-body text-[11px] text-opac-ink-60 mt-1">Arrows shot</p>
            </div>
          </div>

          {sparkScores.length > 1 && (
            <div className="flex items-end gap-1.5 h-10" aria-hidden="true">
              {sparkScores.map((s, i) => {
                const pct = (s - sparkMin) / sparkRange
                const h = Math.max(4, Math.round(pct * 34) + 4)
                const isLast = i === sparkScores.length - 1
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-[3px] ${
                      isLast ? 'bg-opac-green' : 'bg-[rgba(46,125,79,0.28)]'
                    }`}
                    style={{ height: h }}
                  />
                )
              })}
            </div>
          )}

          {!ctx.isProxy && (
            <Link
              href="/scores/new"
              className="glass-green sheen relative overflow-hidden mt-3 w-full h-11 rounded-[13px] text-white font-body text-[14px] font-semibold flex items-center justify-center gap-2 transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985]"
            >
              <span className="relative z-[1]">Record a round</span>
            </Link>
          )}
        </div>

        {/* ── Outstanding fees ─────────────────────────────────────────── */}
        {ctx.canSeeFinancials && overdueTotal > 0 && (
          <Link
            href="/payments"
            className="glass-card glass-interactive rounded-[16px] px-4 py-3.5 border-l-[3px] border-l-opac-gold bg-[rgba(253,244,220,0.62)] flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="font-body text-[14px] font-semibold text-[#8A6508]">
                Outstanding balance
              </p>
              <p className="font-body text-[12px] text-opac-ink-60 truncate">
                {pendingPayments
                  .map((p) => p.description)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ') || 'Club fees'}
              </p>
            </div>
            <span className="font-body text-[13px] font-semibold text-opac-green flex-shrink-0">
              Rs {overdueTotal.toLocaleString()} →
            </span>
          </Link>
        )}

        {/* ── Latest message ───────────────────────────────────────────── */}
        {latestMsg && (
          <Link href="/messages" className="glass-card glass-interactive rounded-[16px] p-3.5">
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-2.5">
              Message from Coach
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[rgba(254,243,199,0.8)] border border-[rgba(212,160,23,0.28)] flex items-center justify-center flex-shrink-0">
                <span className="font-display text-[12px] text-[#92400E]">
                  {String(
                    typeof latestMsg.from === 'object' && latestMsg.from !== null
                      ? ((latestMsg.from as { name?: string }).name ?? 'C')
                      : 'C',
                  ).charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-0.5 gap-2">
                  <span className="font-body text-[13px] font-semibold text-opac-ink truncate">
                    {typeof latestMsg.from === 'object' && latestMsg.from !== null
                      ? ((latestMsg.from as { name?: string }).name ?? 'Coach')
                      : 'Coach'}
                  </span>
                  <span className="font-body text-[11px] text-opac-ink-30 flex-shrink-0">
                    {new Date(latestMsg.createdAt as string).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="font-body text-[13px] text-opac-ink-60 truncate">
                  {latestMsg.body as string}
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </>
  )
}
