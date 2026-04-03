import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect, notFound } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Score Detail — OPAC' }

function arrowColour(v: number): string {
  if (v === 10) return 'bg-yellow-400 text-yellow-900'
  if (v === 9) return 'bg-yellow-300 text-yellow-900'
  if (v === 8 || v === 7) return 'bg-red-500 text-white'
  if (v === 6 || v === 5) return 'bg-blue-500 text-white'
  if (v === 4 || v === 3) return 'bg-[#1f2937] text-white'
  if (v === 2 || v === 1) return 'bg-[#e5e7eb] text-[#111]'
  return 'bg-[#374151] text-[#9ca3af]' // 0 / M
}

export default async function ScoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  const score = await payload.findByID({ collection: 'scores', id }).catch(() => null)
  if (!score) notFound()

  // Ownership check — archer can only see their own scores
  const archerId = typeof score.archer === 'object' && score.archer !== null
    ? String((score.archer as { id: string | number }).id)
    : String(score.archer)
  if (archerId !== String(userId)) notFound()

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

      <div className="p-5 flex flex-col gap-4">
        {/* Summary card */}
        <div className="bg-white rounded-[20px] p-5 border border-opac-border">
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

        {/* End-by-end breakdown */}
        {roundScores.length > 0 && (
          <div className="bg-[#111] rounded-[16px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2a2a]">
              <p className="font-body text-[13px] font-semibold text-[#9ca3af]">End-by-end breakdown</p>
            </div>
            <div className="flex flex-col">
              {roundScores.map((end, eIdx) => {
                const endTotal = end.reduce((s, v) => s + v, 0)
                return (
                  <div key={eIdx} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1f2937] last:border-0">
                    <span className="font-body text-[12px] text-[#6b7280] w-5 flex-shrink-0">{eIdx + 1}.</span>
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
              <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border-t border-[#2a2a2a]">
                <span className="font-body text-[13px] text-[#9ca3af] flex-1">Total</span>
                <span className="font-mono text-[16px] font-semibold text-opac-green">{score.points as number}</span>
              </div>
            </div>
          </div>
        )}

        {roundScores.length === 0 && (
          <div className="bg-white rounded-[16px] p-6 border border-opac-border text-center">
            <p className="font-body text-[14px] text-opac-ink-60">No end-by-end data recorded for this score.</p>
          </div>
        )}

        {score.notes && (
          <div className="bg-white rounded-[16px] p-4 border border-opac-border">
            <p className="font-body text-[12px] font-semibold text-opac-ink-60 mb-1">Notes</p>
            <p className="font-body text-[14px] text-opac-ink">{score.notes as string}</p>
          </div>
        )}
      </div>
    </>
  )
}
