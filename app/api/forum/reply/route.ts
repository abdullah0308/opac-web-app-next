import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { postId, body } = await req.json()
    if (!postId || !body?.trim()) {
      return NextResponse.json({ error: 'postId and body are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const post = await payload.findByID({ collection: 'forum-posts', id: postId, overrideAccess: true })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    type Comment = { author: number; body: string; createdAt: string; id?: string }
    const existing = (post.comments ?? []) as Comment[]

    await payload.update({
      collection: 'forum-posts',
      id: postId,
      overrideAccess: true,
      data: {
        comments: [
          ...existing.map(c => ({ author: c.author, body: c.body, createdAt: c.createdAt })),
          { author: Number(userId), body: body.trim(), createdAt: new Date().toISOString() },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forum/reply]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
