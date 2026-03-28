import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

/**
 * GET /api/me
 * Returns the current user's Payload ID, archerId, roles, and name.
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const user = await payload.findByID({ collection: 'users', id: userId }) as {
      id: string | number
      name?: string
      archerId?: string
      roles?: string[]
    }

    return NextResponse.json({
      id: user.id,
      archerId: user.archerId,
      name: user.name,
      roles: user.roles ?? ['archer'],
    })
  } catch (err) {
    console.error('[api/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
