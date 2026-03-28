import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/attendance/qr
 * Body: { qrCode: string, archerId: string }
 *
 * Validates the QR code against an active session, checks for duplicate
 * attendance today, then creates an attendance record.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { qrCode, archerId } = body as { qrCode?: string; archerId?: string }

    if (!qrCode || !archerId) {
      return NextResponse.json(
        { error: 'qrCode and archerId are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // 1. Find a matching active session with this QR code that hasn't expired
    const now = new Date().toISOString()
    const sessionResult = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { qrCode: { equals: qrCode } },
          { active: { equals: true } },
          { qrExpiresAt: { greater_than: now } },
        ],
      },
      limit: 1,
    })

    const session = sessionResult.docs[0]
    if (!session) {
      return NextResponse.json(
        { error: 'QR code is invalid or has expired' },
        { status: 404 }
      )
    }

    // 2. Check for duplicate attendance today
    const today = new Date().toISOString().split('T')[0]
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

    // 3. Create attendance record
    const record = await payload.create({
      collection: 'attendance',
      data: {
        archer: archerId,
        session: session.id as string,
        method: 'qr',
        status: 'present',
        timestamp: new Date().toISOString(),
      },
    })

    // Populate names for the response
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
    console.error('[QR attendance]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
