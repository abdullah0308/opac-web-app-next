import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

/**
 * POST /api/complete-setup
 * Marks the current user's setupComplete = true.
 * Called after onboarding (avatar + face ID choice).
 */
export async function POST() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: 'users',
      id: userId,
      data: { setupComplete: true },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[complete-setup]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
