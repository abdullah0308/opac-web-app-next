import { getViewContext } from '@/lib/viewer'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'
import ShareWithCoachClient, { type CoachOption } from './ShareWithCoachClient'

export const metadata = { title: 'Score Detail — OPAC' }

function arrowColour(v: number): string {
  if (v === 10) return 'bg-yellow-400 text-yellow-900'
  if (v === 9) return 'bg-yellow-300 text-yellow-900'
  if (v === 8 || v === 7) return 'bg-red-500 text-white'
  if (v === 6 || v === 5) return 'bg-blue-500 text-white'
  if (v === 4 || v === 3) return 'bg-[#1f2937] text-white'
  if (v === 2 || v === 1) return 'bg-[#e5e7eb] text-[#111]'
  return 'bg-[#3A4038] text-[#B9BFB4]' // 0 / M
}

export default async function ScoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getViewContext()
  if (!ctx) redirect('/login')
  const userId = ctx.subjectId

  const payload = await getPayload({ config })

  const score = await payload.findByID({ collection: 'scores', id }).catch(() => null)
  if (!score) notFound()

  // Ownership check — archer can only see their own scores
  const archerId = typeof score.archer === 'object' && score.archer !== null
    ? String((score.archer as { id: string | number }).id)
    : String(score.archer)
  if (archerId !== String(userId)) notFound()

  // Coaches the archer can hand this round to, plus who it went to already.
  const coachesRes = await payload.find({
    collection: 'users',
    where: { and: [{ active: { equals: true } }, { roles: { contains: 'coach' } }] },
    sort: 'name',
    limit: 50,
    depth: 0,
  })
  const coaches: CoachOption[] = (
    coachesRes.docs as unknown as { id: string | number; name?: string }[]
  ).map((c) => ({ id: String(c.id), name: c.name ?? 'Coach' }))

  const sharedRaw = (score.sharedWith as unknown[] | null) ?? []
  const sharedWithId = sharedRaw.length
    ? typeof sharedRaw[0] === 'object' && sharedRaw[0] !== null
      ? String((sharedRaw[0] as { id?: string | number }).id)
      : String(sharedRaw[0])
    : null
  const verifiedByName =
    score.verifiedBy && typeof score.verifiedBy === 'object'
      ? ((score.verifiedBy as { name?: string }).name ?? undefined)
      : undefined

  const roundScores = (score.roundScores as number[][] | null) ?? []
  const dateStr = score.date
    ? new Date(score.date as string).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const pct = score.maxPoints ? Math.round(((score.points as number) / (score.maxPoints as number)) * 100) : null
  const golds = roundScores.flat().filter(v => v >= 9).length
  const totalArrows = roundScores.flat().filter(v => v > 0 || v === 0).length

  return (
    <>
      <ScreenHeader title="Score Detail" showBack backHref="/scores" />

      <div className="p-5 flex flex-col gap-4 stagger">
        {/* Summary card */}
        <div className="glass-card rounded-[20px] p-5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-mono text-[40px] font-semibold text-opac-green leading-none">{score.points as number}</span>
            {score.maxPoints && (
              <span className="font-mono text-[18px] text-opac-ink-30">/ {score.maxPoints as number}</span>
            )}
            {pct !== null && (
              <span className="ml-auto font-body text-[15px] font-semibold text-opac-ink-60">{pct}%</span>
            )}
          </div>
          <p className="font-body text-[13px] text-opac-ink-60 mb-3">{dateStr}</p>

          <div className="flex flex-wrap gap-2">
            <span className={`text-[12px] font-semibold px-3 py-1 rounded-full ${
              score.roundType === 'competition' ? 'bg-opac-gold-light text-opac-gold' : 'bg-opac-green-light text-opac-green'
            }`}>
              {score.roundType as string}
            </span>
            {score.scoringFormat && (
              <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-opac-surface text-opac-ink-60">
                {score.scoringFormat as string} round
              </span>
            )}
            <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">
              {golds} golds
            </span>
            {totalArrows > 0 && (
              <span className="text-[12px] font-semibold px-3 py-1 rounded-full bg-opac-surface text-opac-ink-60">
                avg {(score.points as number / totalArrows).toFixed(1)} / arrow
              </span>
            )}
          </div>
        </div>

        {/* Share with a coach */}
        {!ctx.isProxy && (
          <ShareWithCoachClient
            scoreId={String(id)}
            coaches={coaches}
            sharedWithId={sharedWithId}
            verified={Boolean(score.verified)}
            coachFeedback={(score.coachFeedback as string) || undefined}
            verifiedByName={verifiedByName}
          />
        )}

        {/* End-by-end breakdown */}
        {roundScores.length > 0 && (
          <div className="glass-dark rounded-[18px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.1)]">
              <p className="font-body text-[13px] font-semibold text-[rgba(255,255,255,0.6)]">End-by-end breakdown</p>
            </div>
            <div className="flex flex-col">
              {roundScores.map((end, eIdx) => {
                const endTotal = end.reduce((s, v) => s + v, 0)
                return (
                  <div key={eIdx} className="flex items-center gap-3 px-4 py-2.5 border-b border-[rgba(255,255,255,0.07)] last:border-0">
                    <span className="font-body text-[12px] text-[rgba(255,255,255,0.45)] w-5 flex-shrink-0">{eIdx + 1}.</span>
                    <div className="flex gap-1 flex-1">
                      {end.map((val, aIdx) => (
                        <span key={aIdx}
                          className={`w-7 h-7 rounded-md text-[12px] font-bold flex items-center justify-center flex-shrink-0 ${arrowColour(val)}`}>
                          {val === 0 ? 'M' : val}
                        </span>
                      ))}
                    </div>
                    <span className="font-mono text-[13px] text-white w-7 text-right flex-shrink-0">{endTotal}</span>
                  </div>
                )
              })}

              {/* Grand total row */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(255,255,255,0.06)] border-t border-[rgba(255,255,255,0.12)]">
                <span className="font-body text-[13px] text-[rgba(255,255,255,0.6)] flex-1">Total</span>
                <span className="font-mono text-[16px] font-semibold text-[#8FD6AB]">{score.points as number}</span>
              </div>
            </div>
          </div>
        )}

        {roundScores.length === 0 && (
          <div className="glass-card rounded-[16px] p-6 text-center">
            <p className="font-body text-[14px] text-opac-ink-60">No end-by-end data recorded for this score.</p>
          </div>
        )}

        {score.notes && (
          <div className="glass-card rounded-[16px] p-4">
            <p className="font-body text-[12px] font-semibold text-opac-ink-60 mb-1">Notes</p>
            <p className="font-body text-[14px] text-opac-ink">{score.notes as string}</p>
          </div>
        )}
      </div>
    </>
  )
}
