import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const roles = await getUserRoles()
    if (!roles.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { archerId, name, email, password, bowType, level, clan, userRoles, gender } = body as {
      archerId?: string; name?: string; email?: string; password?: string
      bowType?: string; level?: string; clan?: string; userRoles?: string[]; gender?: string
    }

    if (!archerId || !name || !email || !password) {
      return NextResponse.json({ error: 'archerId, name, email and password are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Check duplicate archerId
    const existing = await payload.find({
      collection: 'users',
      where: { archerId: { equals: archerId.toUpperCase() } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      return NextResponse.json({ error: `Archer ID ${archerId.toUpperCase()} already exists` }, { status: 409 })
    }

    const user = await payload.create({
      collection: 'users',
      data: {
        archerId: archerId.toUpperCase(),
        name,
        email,
        password,
        roles: (userRoles ?? ['archer']) as ('archer' | 'coach' | 'admin')[],
        active: true,
        faceEnrolled: false,
        setupComplete: true,
        ...(bowType ? { bowType: bowType as 'recurve' | 'compound' | 'barebow' } : {}),
        ...(level ? { level: level as 'beginner' | 'intermediate' | 'elite' } : {}),
        ...(gender ? { gender: gender as 'male' | 'female' | 'other' } : {}),
        ...(clan ? { clanId: clan } : {}),
      },
    })

    return NextResponse.json({ success: true, id: user.id, archerId: archerId.toUpperCase() })
  } catch (err) {
    console.error('[admin/create-user]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
