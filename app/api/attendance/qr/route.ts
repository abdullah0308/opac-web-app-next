import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/attendance/qr
 * Body: { archerId: string }
 *
 * The archer's personal QR code encodes their archerId (e.g. "AM0032").
 * Finds or auto-creates today's session, then records attendance.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { archerId } = body as { archerId?: string }

    if (!archerId) {
      return NextResponse.json({ error: 'archerId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // 1. Find the archer by archerId
    const archerResult = await payload.find({
      collection: 'users',
      where: { archerId: { equals: archerId.toUpperCase() } },
      limit: 1,
    })

    const archer = archerResult.docs[0]
    if (!archer) {
      return NextResponse.json({ error: 'Archer not found' }, { status: 404 })
    }

    // 2. Find or auto-create today's session
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

    // 3. Check for duplicate attendance today
    const duplicate = await payload.find({
      collection: 'attendance',
      where: {
        and: [
          { archer: { equals: archer.id } },
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

    // 4. Create attendance record
    const record = await payload.create({
      collection: 'attendance',
      data: {
        archer: archer.id as string,
        session: session.id as string,
        method: 'qr',
        status: 'present',
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      attendanceId: record.id,
      sessionName: session.name as string,
      archerName: archer.name as string,
    })
  } catch (err) {
    console.error('[QR attendance]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
