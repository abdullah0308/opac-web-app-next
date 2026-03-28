import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

/**
 * GET /api/face-data
 * Returns all enrolled face descriptors for client-side matching.
 * Requires authentication.
 */
export async function GET(_req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const faceDataResult = await payload.find({
      collection: 'face-data',
      where: { enrolled: { equals: true } },
      limit: 500,
    })

    // Return only the data needed for client-side matching
    const descriptors = faceDataResult.docs.map((d) => ({
      archerId: typeof d.archer === 'object' && d.archer !== null
        ? (d.archer as { id: string | number }).id
        : d.archer,
      descriptor: d.descriptor as number[],
    }))

    return NextResponse.json({ descriptors })
  } catch (err) {
    console.error('[face-data GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/face-data
 * Enroll a face descriptor for the current user.
 * Body: { descriptor: number[] }
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { descriptor } = body as { descriptor?: number[] }

    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return NextResponse.json(
        { error: 'descriptor must be an array of 128 numbers' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find the Payload user
    const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Upsert: delete old record if exists, create new
    const existing = await payload.find({
      collection: 'face-data',
      where: { archer: { equals: user.id } },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.delete({
        collection: 'face-data',
        id: existing.docs[0].id,
      })
    }

    await payload.create({
      collection: 'face-data',
      data: {
        archer: user.id as string,
        descriptor,
        enrolled: true,
        enrolledAt: new Date().toISOString(),
      },
    })

    // Mark user as enrolled
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { faceEnrolled: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[face-data POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
