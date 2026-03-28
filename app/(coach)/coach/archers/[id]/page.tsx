import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Archer Detail — OPAC Coach' }

export default async function ArcherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  let archer
  try {
    archer = await payload.findByID({ collection: 'users', id })
  } catch {
    notFound()
  }

  // Archer's scores
  const scoresResult = await payload.find({
    collection: 'scores',
    where: { archer: { equals: id } },
    sort: '-date',
    limit: 10,
  })
  type ScoreDoc = { id: string | number; points?: number; maxPoints?: number; roundType?: string; date?: string; sessionType?: string }
  const scores = scoresResult.docs as unknown as ScoreDoc[]

  // Attendance rate (last 30 sessions)
  const attResult = await payload.find({
    collection: 'attendance',
    where: {
      and: [
        { archer: { equals: id } },
        { status: { equals: 'present' } },
      ],
    },
    sort: '-timestamp',
    limit: 30,
  })
  const presentCount = attResult.totalDocs

  const name = (archer.name as string) || 'Archer'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const best = scores.length > 0 ? Math.max(...scores.map((s) => s.points ?? 0)) : 0
  const avg = scores.length > 0
    ? Math.round(scores.reduce((s, r) => s + (r.points ?? 0), 0) / scores.length)
    : 0

  return (
    <>
      <ScreenHeader title={name} showBack backHref="/coach/archers" />

      <div className="p-5 flex flex-col gap-4">
        {/* Archer card */}
        <div className="bg-white rounded-[20px] p-5 border border-opac-border flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
            <span className="font-display text-[20px] text-opac-green">{initials}</span>
          </div>
          <div>
            <p className="font-display text-[20px] text-opac-ink">{name}</p>
            <p className="font-body text-[14px] text-opac-ink-60 capitalize">
              {archer.bowType as string ?? 'Recurve'} · {archer.gender as string ?? ''}
            </p>
            <p className="font-body text-[13px] text-opac-ink-60">{archer.email as string}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-[14px] p-3 border border-opac-border text-center">
            <p className="font-mono text-[22px] font-semibold text-opac-green">{best > 0 ? best : '—'}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Best</p>
          </div>
          <div className="bg-white rounded-[14px] p-3 border border-opac-border text-center">
            <p className="font-mono text-[22px] font-semibold text-opac-ink">{avg > 0 ? avg : '—'}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Avg</p>
          </div>
          <div className="bg-white rounded-[14px] p-3 border border-opac-border text-center">
            <p className="font-mono text-[22px] font-semibold text-opac-ink">{presentCount}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Sessions</p>
          </div>
        </div>

        {/* Score history */}
        {scores.length > 0 && (
          <div>
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">Score History</p>
            <div className="flex flex-col gap-2">
              {scores.map((score) => {
                const dateStr = score.date
                  ? new Date(score.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : '—'
                return (
                  <div key={score.id} className="bg-white rounded-[12px] px-4 py-3 border border-opac-border flex items-center">
                    <div className="flex-1">
                      <p className="font-body text-[13px] text-opac-ink-60">{score.roundType ?? 'Training'} · {dateStr}</p>
                    </div>
                    <span className="font-mono text-[18px] font-semibold text-opac-green">{score.points ?? '—'}</span>
                    {score.maxPoints && (
                      <span className="font-mono text-[12px] text-opac-ink-30 ml-1">/{score.maxPoints}</span>
                    )}
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
