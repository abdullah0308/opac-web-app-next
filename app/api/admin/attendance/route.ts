import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

async function checkAdmin() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const roles = await getUserRoles()
  if (!roles.includes('admin') && !roles.includes('coach')) return null
  return userId
}

export async function POST(req: NextRequest) {
  try {
    const userId = await checkAdmin()
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, archerId } = await req.json()
    if (!sessionId || !archerId) return NextResponse.json({ error: 'sessionId and archerId required' }, { status: 400 })

    const payload = await getPayload({ config })

    // Check for duplicate
    const existing = await payload.find({
      collection: 'attendance',
      where: { and: [{ session: { equals: sessionId } }, { archer: { equals: archerId } }] },
      limit: 1,
    })
    if (existing.docs[0]) {
      return NextResponse.json({ success: true, id: existing.docs[0].id, existing: true })
    }

    const rec = await payload.create({
      collection: 'attendance',
      data: {
        session: sessionId,
        archer: archerId,
        method: 'manual',
        status: 'present',
        timestamp: new Date().toISOString(),
      },
    })
    return NextResponse.json({ success: true, id: rec.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await checkAdmin()
    if (!userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, archerId } = await req.json()
    const payload = await getPayload({ config })

    const existing = await payload.find({
      collection: 'attendance',
      where: { and: [{ session: { equals: sessionId } }, { archer: { equals: archerId } }] },
      limit: 1,
    })
    if (existing.docs[0]) {
      await payload.delete({ collection: 'attendance', id: existing.docs[0].id })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
