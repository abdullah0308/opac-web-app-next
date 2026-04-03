import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const roles = await getUserRoles()
    if (!roles.includes('admin') && !roles.includes('coach')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const payload = await getPayload({ config })

    // Only allow updating safe fields
    const allowed: Record<string, unknown> = {}
    const allowedFields = ['name', 'bowType', 'gender', 'phone', 'dateOfBirth', 'level', 'clanId', 'roles', 'active']
    for (const field of allowedFields) {
      if (data[field] !== undefined) allowed[field] = data[field]
    }
    // Coerce clanId to number (Payload relationship field requires numeric ID)
    if (allowed.clanId !== undefined && allowed.clanId !== null && allowed.clanId !== '') {
      allowed.clanId = Number(allowed.clanId)
    }
    // Admin only: update password
    if (roles.includes('admin') && data.password) {
      allowed.password = data.password
    }

    const updated = await payload.update({ collection: 'users', id, data: allowed })
    return NextResponse.json({ success: true, id: updated.id })
  } catch (err) {
    console.error('[admin/update-user]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
