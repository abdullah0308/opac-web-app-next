import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'

/** DELETE /api/admin/forum  { postId } — remove a forum post. */
export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = await getUserRoles()
  if (!roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { postId } = (await req.json()) as { postId?: string }
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'forum-posts',
      id: postId,
      overrideAccess: true,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/forum DELETE]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/admin/forum  { postId, pinned?, locked? } — moderate a post. */
export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = await getUserRoles()
  if (!roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { postId, pinned, locked } = (await req.json()) as {
      postId?: string
      pinned?: boolean
      locked?: boolean
    }
    if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (pinned !== undefined) data.pinned = pinned
    if (locked !== undefined) data.locked = locked

    const payload = await getPayload({ config })
    await payload.update({
      collection: 'forum-posts',
      id: postId,
      overrideAccess: true,
      data,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/forum PATCH]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
