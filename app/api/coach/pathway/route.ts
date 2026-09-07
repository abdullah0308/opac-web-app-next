import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'
import { relId } from '@/lib/relId'

/**
 * POST /api/coach/pathway
 * Body: { archerId, stageId, completed: boolean[], coachNotes }
 *
 * The coach owns the pathway. Creates the archer's record on first save and
 * resizes the requirement list to match whichever stage they are on.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles()
  if (!roles.includes('coach') && !roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { archerId, stageId, completed, coachNotes } = (await req.json()) as {
      archerId?: string
      stageId?: string
      completed?: boolean[]
      coachNotes?: string
    }

    if (!archerId || !stageId) {
      return NextResponse.json(
        { error: 'Pick an archer and a stage.' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    // Size the checklist to the stage the archer is actually on.
    const stage = await payload
      .findByID({ collection: 'pathways', id: stageId })
      .catch(() => null)
    if (!stage) {
      return NextResponse.json({ error: 'That stage no longer exists.' }, { status: 404 })
    }
    const stageReqs = (stage as unknown as { requirements?: unknown[] }).requirements
    const reqCount = Array.isArray(stageReqs) ? stageReqs.length : 0

    const flags = Array.from({ length: reqCount }, (_, i) => ({
      completed: Boolean(completed?.[i]),
    }))

    const existing = await payload.find({
      collection: 'archer-pathways',
      where: { archer: { equals: archerId } },
      limit: 1,
    })

    const data = {
      archer: relId(archerId) as string,
      pathwayStage: relId(stageId) as string,
      coachNotes: coachNotes ?? '',
      updatedBy: relId(userId) as string,
      completedRequirements: flags,
    }

    if (existing.docs[0]) {
      await payload.update({
        collection: 'archer-pathways',
        id: existing.docs[0].id,
        overrideAccess: true,
        data,
      })
    } else {
      await payload.create({
        collection: 'archer-pathways',
        overrideAccess: true,
        data,
      })
    }

    return NextResponse.json({ success: true, requirementCount: reqCount })
  } catch (err) {
    console.error('[coach/pathway]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
