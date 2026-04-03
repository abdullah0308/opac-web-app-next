import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, body } = await req.json()
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const post = await payload.create({
      collection: 'forum-posts',
      data: {
        author: userId,
        title: title.trim(),
        body: body.trim(),
      },
    })

    return NextResponse.json({ success: true, id: post.id })
  } catch (err) {
    console.error('[forum/post]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
