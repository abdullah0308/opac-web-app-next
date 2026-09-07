import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'
import { relId } from '@/lib/relId'

/**
 * POST /api/scores/share
 * Body: { scoreId, coachId }  — coachId null clears the share.
 *
 * An archer chooses which coach sees a training round. Only the archer who
 * shot the round may share it.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scoreId, coachId } = (await req.json()) as {
      scoreId?: string
      coachId?: string | null
    }
    if (!scoreId) {
      return NextResponse.json({ error: 'scoreId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const score = await payload
      .findByID({ collection: 'scores', id: scoreId, depth: 0 })
      .catch(() => null)
    if (!score) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    const owner =
      typeof score.archer === 'object' && score.archer !== null
        ? String((score.archer as { id?: string | number }).id)
        : String(score.archer)
    if (owner !== String(userId)) {
      return NextResponse.json(
        { error: 'You can only share your own rounds.' },
        { status: 403 },
      )
    }

    if (!coachId) {
      await payload.update({
        collection: 'scores',
        id: scoreId,
        overrideAccess: true,
        data: { sharedWith: [] },
      })
      return NextResponse.json({ success: true, shared: false })
    }

    // Only share with somebody who is actually a coach.
    const coach = await payload
      .findByID({ collection: 'users', id: coachId, depth: 0 })
      .catch(() => null)
    const coachRoles = (coach as { roles?: string[] } | null)?.roles ?? []
    if (!coach || !coachRoles.includes('coach')) {
      return NextResponse.json({ error: 'That member is not a coach.' }, { status: 400 })
    }

    await payload.update({
      collection: 'scores',
      id: scoreId,
      overrideAccess: true,
      data: { sharedWith: [relId(coachId) as string] },
    })

    return NextResponse.json({ success: true, shared: true })
  } catch (err) {
    console.error('[scores/share]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
