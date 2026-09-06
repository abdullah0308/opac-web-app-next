import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

/**
 * POST /api/coach/verify-score
 * Body: { scoreId, verified: boolean, feedback?: string }
 *
 * Marks a training round as checked by a coach and, optionally, leaves a note
 * back to the archer. Training scores never affect the leaderboard — this is
 * coaching feedback, not scoring.
 */
export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roles = await getUserRoles()
  if (!roles.includes('coach') && !roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { scoreId, verified, feedback } = (await req.json()) as {
      scoreId?: string
      verified?: boolean
      feedback?: string
    }
    if (!scoreId) {
      return NextResponse.json({ error: 'scoreId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'scores',
      id: scoreId,
      overrideAccess: true,
      data: {
        verified: verified !== false,
        verifiedBy: userId,
        verifiedAt: new Date().toISOString(),
        ...(feedback !== undefined ? { coachFeedback: feedback } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[coach/verify-score]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
