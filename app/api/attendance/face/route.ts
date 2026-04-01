import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/attendance/face
 * Body: { archerId: string, matchConfidence: number }
 *
 * Records face-verified attendance after client-side matching confirms identity.
 * matchConfidence is the Euclidean distance (lower = better match; < 0.5 = valid).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { archerId, matchConfidence } = body as {
      archerId?: string
      matchConfidence?: number
    }

    if (!archerId || matchConfidence === undefined) {
      return NextResponse.json(
        { error: 'archerId and matchConfidence are required' },
        { status: 400 }
      )
    }

    if (matchConfidence >= 0.5) {
      return NextResponse.json(
        { error: 'Face match confidence too low' },
        { status: 422 }
      )
    }

    const payload = await getPayload({ config })

    // Find the active session for today
    const today = new Date().toISOString().split('T')[0]
    const sessionResult = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { active: { equals: true } },
          { date: { greater_than_equal: `${today}T00:00:00.000Z` } },
        ],
      },
      sort: '-date',
      limit: 1,
    })

    let session = sessionResult.docs[0]
    if (!session) {
      // Auto-create a daily session so face check-in always works
      const dateLabel = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
      session = await payload.create({
        collection: 'sessions',
        data: {
          name: `Training — ${dateLabel}`,
          date: `${today}T00:00:00.000Z`,
          active: true,
        },
      })
    }

    // Check for duplicate
    const duplicate = await payload.find({
      collection: 'attendance',
      where: {
        and: [
          { archer: { equals: archerId } },
          { session: { equals: session.id } },
          { timestamp: { greater_than_equal: `${today}T00:00:00.000Z` } },
        ],
      },
      limit: 1,
    })

    if (duplicate.docs.length > 0) {
      return NextResponse.json(
        { error: 'Already checked in for this session' },
        { status: 409 }
      )
    }

    // Create attendance record
    const record = await payload.create({
      collection: 'attendance',
      data: {
        archer: archerId,
        session: session.id as string,
        method: 'face',
        status: 'present',
        timestamp: new Date().toISOString(),
      },
    })

    const archerResult = await payload.findByID({
      collection: 'users',
      id: archerId,
    })

    return NextResponse.json({
      success: true,
      attendanceId: record.id,
      sessionName: session.name as string,
      archerName: archerResult.name as string,
    })
  } catch (err) {
    console.error('[Face attendance]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
