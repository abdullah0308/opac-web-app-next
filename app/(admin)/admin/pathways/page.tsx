import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Pathway Management — OPAC Admin' }

export default async function AdminPathwaysPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const pathwaysResult = await payload.find({
    collection: 'pathways',
    sort: 'order',
    limit: 50,
  })
  type PathwayDoc = { id: string | number; stageName?: string; description?: string; requirements?: unknown[] }
  const pathways = pathwaysResult.docs as unknown as PathwayDoc[]

  // Count archers per stage
  const archerPathwaysResult = await payload.find({
    collection: 'archer-pathways',
    limit: 500,
  })

  type ArcherPathway = { pathwayStageId?: { id?: string | number } | string | null }
  const archersByStage = new Map<string, number>()
  for (const ap of archerPathwaysResult.docs as unknown as ArcherPathway[]) {
    if (!ap.pathwayStageId) continue
    const stageId = typeof ap.pathwayStageId === 'object' && ap.pathwayStageId !== null
      ? String((ap.pathwayStageId as { id?: string | number }).id)
      : String(ap.pathwayStageId)
    archersByStage.set(stageId, (archersByStage.get(stageId) ?? 0) + 1)
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[24px] text-opac-ink">Pathways</h1>
        <p className="font-body text-[13px] text-opac-ink-60">{pathways.length} stages</p>
      </div>

      {pathways.length === 0 ? (
        <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
          <p className="font-body text-[15px] text-opac-ink-60">No pathway stages configured.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pathways.map((stage, idx) => {
            const archerCount = archersByStage.get(String(stage.id)) ?? 0
            const reqCount = Array.isArray(stage.requirements) ? stage.requirements.length : 0

            return (
              <div key={String(stage.id)} className="bg-white rounded-[16px] p-4 border border-opac-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body text-[11px] font-semibold text-opac-ink-30">Stage {idx + 1}</span>
                    </div>
                    <p className="font-display text-[18px] text-opac-ink">
                      {stage.stageName ?? `Stage ${idx + 1}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[18px] font-semibold text-opac-green">{archerCount}</p>
                    <p className="font-body text-[11px] text-opac-ink-60">archers</p>
                  </div>
                </div>
                {stage.description && (
                  <p className="font-body text-[13px] text-opac-ink-60 mb-2">{stage.description as string}</p>
                )}
                {reqCount > 0 && (
                  <p className="font-body text-[12px] text-opac-ink-30">{reqCount} requirement{reqCount !== 1 ? 's' : ''}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
