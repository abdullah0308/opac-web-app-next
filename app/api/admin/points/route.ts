import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

const SOURCES = ['attendance', 'pointing-day', 'dueling', 'competition', 'other'] as const

async function requireAdmin() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const roles = await getUserRoles()
  if (!roles.includes('admin')) return null
  return userId
}

/** POST — award points to one archer. */
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { archerId, points, source, eventName, date, note } = await req.json()

    if (!archerId) {
      return NextResponse.json({ error: 'Pick an archer.' }, { status: 400 })
    }
    const value = Number(points)
    if (!Number.isFinite(value) || value === 0) {
      return NextResponse.json(
        { error: 'Points must be a number other than zero.' },
        { status: 400 },
      )
    }
    if (source && !SOURCES.includes(source)) {
      return NextResponse.json({ error: 'Unknown points category.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const settings = (await payload
      .findGlobal({ slug: 'global-settings' })
      .catch(() => null)) as { season?: string } | null

    const created = await payload.create({
      collection: 'points-entries',
      overrideAccess: true,
      data: {
        archer: archerId,
        source: source ?? 'competition',
        points: value,
        eventName: eventName || null,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        season: settings?.season ?? String(new Date().getFullYear()),
        note: note || null,
        awardedBy: adminId,
      },
    })

    return NextResponse.json({ success: true, id: created.id })
  } catch (err) {
    console.error('[admin/points POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** DELETE — remove a single entry, or every entry from one sheet upload. */
export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { entryId, batchId } = await req.json()
    const payload = await getPayload({ config })

    if (batchId) {
      const rows = await payload.find({
        collection: 'points-entries',
        where: { batchId: { equals: batchId } },
        limit: 1000,
        depth: 0,
      })
      for (const row of rows.docs) {
        await payload.delete({
          collection: 'points-entries',
          id: row.id,
          overrideAccess: true,
        })
      }
      return NextResponse.json({ success: true, removed: rows.docs.length })
    }

    if (!entryId) {
      return NextResponse.json({ error: 'entryId or batchId required' }, { status: 400 })
    }

    await payload.delete({
      collection: 'points-entries',
      id: entryId,
      overrideAccess: true,
    })
    return NextResponse.json({ success: true, removed: 1 })
  } catch (err) {
    console.error('[admin/points DELETE]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
