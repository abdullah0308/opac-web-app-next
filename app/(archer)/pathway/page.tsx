import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Pathway — OPAC' }

export default async function PathwayPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  const archerPathwayResult = await payload.find({
    collection: 'archer-pathways',
    where: { archer: { equals: user.id } },
    limit: 1,
    sort: '-updatedAt',
  })
  const archerPathway = archerPathwayResult.docs[0] as {
    pathwayStage?: { id?: string | number; stageName?: string } | string | null
    completedRequirements?: { completed?: boolean }[]
    coachNotes?: string
  } | undefined

  // Load all pathway stages for the progression ladder
  const pathwaysResult = await payload.find({
    collection: 'pathways',
    sort: 'order',
    limit: 20,
  })
  type PathwayStage = { id: string | number; stageName?: string; description?: string }
  const allStages = pathwaysResult.docs as unknown as PathwayStage[]

  const currentStageId =
    archerPathway && typeof archerPathway.pathwayStage === 'object' && archerPathway.pathwayStage !== null
      ? (archerPathway.pathwayStage as { id?: string | number }).id
      : null

  const completedCount = archerPathway?.completedRequirements?.filter((r) => r.completed).length ?? 0
  const totalCount = archerPathway?.completedRequirements?.length ?? 0
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const currentStageName =
    archerPathway && typeof archerPathway.pathwayStage === 'object' && archerPathway.pathwayStage !== null
      ? (archerPathway.pathwayStage as { stageName?: string }).stageName ?? 'In Progress'
      : 'In Progress'

  return (
    <>
      <ScreenHeader title="Pathway" />

      <div className="p-5 flex flex-col gap-4">
        {/* Current stage card */}
        {archerPathway ? (
          <div className="bg-white rounded-[20px] p-5 border border-opac-border border-l-[4px] border-l-opac-gold shadow-card">
            <p className="font-body text-[11px] font-semibold text-opac-gold uppercase tracking-[0.07em] mb-1">Current Stage</p>
            <p className="font-display text-[22px] text-opac-ink mb-3">{currentStageName}</p>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 h-2 rounded-full bg-opac-surface overflow-hidden">
                <div className="h-full rounded-full bg-opac-green" style={{ width: `${progress}%` }} />
              </div>
              <span className="font-mono text-[14px] font-semibold text-opac-green">{progress}%</span>
            </div>
            {totalCount > 0 && (
              <p className="font-body text-[13px] text-opac-ink-60">
                {completedCount} of {totalCount} requirements completed
              </p>
            )}
            {archerPathway.coachNotes && (
              <div className="mt-3 p-3 bg-opac-surface rounded-[10px]">
                <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.07em] mb-1">Coach Notes</p>
                <p className="font-body text-[13px] text-opac-ink-60">{archerPathway.coachNotes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[16px] p-6 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No pathway assigned yet. Contact your coach.</p>
          </div>
        )}

        {/* Stage ladder */}
        {allStages.length > 0 && (
          <div>
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">
              All Stages
            </p>
            <div className="flex flex-col gap-2">
              {allStages.map((stage) => {
                const isCurrent = String(stage.id) === String(currentStageId)

                return (
                  <div key={String(stage.id)}
                    className={`rounded-[14px] px-4 py-3.5 border ${
                      isCurrent
                        ? 'bg-opac-green-light border-opac-green'
                        : 'bg-white border-opac-border'
                    }`}>
                    <div className="flex items-center justify-between">
                      <p className={`font-body text-[14px] font-semibold ${isCurrent ? 'text-opac-green' : 'text-opac-ink'}`}>
                        {stage.stageName ?? `Stage ${stage.id}`}
                      </p>
                      {isCurrent && (
                        <span className="font-body text-[11px] font-semibold text-opac-green bg-white rounded-full px-2.5 py-0.5">
                          Current
                        </span>
                      )}
                    </div>
                    {stage.description && (
                      <p className="font-body text-[12px] text-opac-ink-60 mt-1">{stage.description as string}</p>
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
