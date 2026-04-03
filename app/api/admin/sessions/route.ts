import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const roles = await getUserRoles()
    if (!roles.includes('admin') && !roles.includes('coach')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, date, active } = await req.json()
    if (!name || !date) return NextResponse.json({ error: 'name and date required' }, { status: 400 })

    const payload = await getPayload({ config })
    const session = await payload.create({
      collection: 'sessions',
      data: { name, date, active: active ?? true },
    })
    return NextResponse.json({ success: true, id: session.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
