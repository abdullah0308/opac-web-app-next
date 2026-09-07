import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'
import { relId } from '@/lib/relId'

async function requireAdmin() {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const roles = await getUserRoles()
  return roles.includes('admin') ? userId : null
}

/** POST — create a clan. */
export async function POST(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { name, colour, logoUrl, motto, leader, coLeader } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Give the clan a name.' }, { status: 400 })
    }
    if (leader && coLeader && String(leader) === String(coLeader)) {
      return NextResponse.json(
        { error: 'The leader and co-leader must be two different people.' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    const settings = (await payload
      .findGlobal({ slug: 'global-settings' })
      .catch(() => null)) as { season?: string } | null

    const created = await payload.create({
      collection: 'clans',
      overrideAccess: true,
      data: {
        name: name.trim(),
        colour: colour || '#2E7D4F',
        logoUrl: logoUrl || null,
        motto: motto || null,
        leader: relId(leader),
        coLeader: relId(coLeader),
        points: 0,
        season: settings?.season ?? String(new Date().getFullYear()),
        createdBy: relId(adminId),
      },
    })
    return NextResponse.json({ success: true, id: created.id })
  } catch (err) {
    console.error('[admin/clans POST]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** PATCH — rename, recolour, or replace the crest. */
export async function PATCH(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { clanId, name, colour, logoUrl, motto, leader, coLeader } = await req.json()
    if (!clanId) return NextResponse.json({ error: 'clanId required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (colour !== undefined) data.colour = colour
    if (logoUrl !== undefined) data.logoUrl = logoUrl || null
    if (motto !== undefined) data.motto = motto || null
    if (leader !== undefined) data.leader = relId(leader)
    if (coLeader !== undefined) data.coLeader = relId(coLeader)

    if (data.leader && data.coLeader && String(data.leader) === String(data.coLeader)) {
      return NextResponse.json(
        { error: 'The leader and co-leader must be two different people.' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'clans',
      id: clanId,
      overrideAccess: true,
      data,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/clans PATCH]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** DELETE — remove a clan, unassigning its members first. */
export async function DELETE(req: NextRequest) {
  const adminId = await requireAdmin()
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { clanId } = await req.json()
    if (!clanId) return NextResponse.json({ error: 'clanId required' }, { status: 400 })

    const payload = await getPayload({ config })

    // Never leave members pointing at a clan that no longer exists.
    const members = await payload.find({
      collection: 'users',
      where: { clanId: { equals: clanId } },
      limit: 500,
      depth: 0,
    })
    for (const m of members.docs) {
      await payload.update({
        collection: 'users',
        id: m.id,
        overrideAccess: true,
        data: { clanId: null },
      })
    }

    await payload.delete({ collection: 'clans', id: clanId, overrideAccess: true })
    return NextResponse.json({ success: true, unassigned: members.docs.length })
  } catch (err) {
    console.error('[admin/clans DELETE]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
