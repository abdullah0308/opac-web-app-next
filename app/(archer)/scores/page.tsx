import Link from 'next/link'
import { getViewContext } from '@/lib/viewer'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'My Scores — OPAC' }

export default async function ScoresPage() {
  const ctx = await getViewContext()
  if (!ctx) redirect('/login')
  const userId = ctx.subjectId

  const payload = await getPayload({ config })

  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const scoresResult = await payload.find({
    collection: 'scores',
    where: { archer: { equals: user.id } },
    sort: '-date',
    limit: 20,
  })
  type ScoreDoc = { id: string | number; points?: number; maxPoints?: number; roundType?: string; scoringFormat?: string; date?: string; notes?: string }
  const scores = scoresResult.docs as unknown as ScoreDoc[]

  const avgScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + (r.points ?? 0), 0) / scores.length)
    : 0
  const bestScore = scores.length
    ? Math.max(...scores.map((r) => r.points ?? 0))
    : 0

  return (
    <>
      <ScreenHeader
        title="Scores"
        right={
          <Link href="/scores/new"
            className="h-9 px-4 glass-green rounded-[11px] text-white transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985] font-body text-[13px] font-semibold flex items-center">
            + Add
          </Link>
        }
      />

      <div className="p-5 flex flex-col gap-4 stagger">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-[16px] p-4 text-center">
            <p className="font-mono text-[28px] font-semibold text-opac-green">{bestScore}</p>
            <p className="font-body text-[12px] text-opac-ink-60 mt-0.5">Personal best</p>
          </div>
          <div className="glass-card rounded-[16px] p-4 text-center">
            <p className="font-mono text-[28px] font-semibold text-opac-ink">{avgScore}</p>
            <p className="font-body text-[12px] text-opac-ink-60 mt-0.5">Average score</p>
          </div>
        </div>

        {/* Score list */}
        {scores.length === 0 ? (
          <div className="glass-card rounded-[16px] p-8 text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No scores recorded yet.</p>
            <Link href="/scores/new" className="mt-3 inline-block font-body text-[14px] font-semibold text-opac-green">
              Add your first score →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {scores.map((score) => {
              const dateStr = score.date
                ? new Date(score.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
                : '—'
              const pct = score.maxPoints ? Math.round(((score.points ?? 0) / score.maxPoints) * 100) : null

              return (
                <Link key={score.id} href={`/scores/${score.id}`} className="glass-card glass-interactive rounded-[14px] p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[22px] font-semibold text-opac-green">{score.points ?? '—'}</span>
                      {score.maxPoints && (
                        <span className="font-mono text-[13px] text-opac-ink-30">/{score.maxPoints}</span>
                      )}
                    </div>
                    <p className="font-body text-[12px] text-opac-ink-60 mt-0.5">{dateStr}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {pct !== null && (
                      <span className="font-body text-[13px] font-semibold text-opac-ink">{pct}%</span>
                    )}
                    {score.scoringFormat && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-opac-surface text-opac-ink-60">
                        {score.scoringFormat} round
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      score.roundType === 'competition'
                        ? 'bg-opac-gold-light text-opac-gold'
                        : 'bg-opac-green-light text-opac-green'
                    }`}>
                      {score.roundType ?? 'training'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
