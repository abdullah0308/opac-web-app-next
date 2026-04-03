import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { toId, body } = await req.json()
    if (!toId || !body?.trim()) {
      return NextResponse.json({ error: 'toId and body are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const message = await payload.create({
      collection: 'messages',
      overrideAccess: true,
      data: {
        from: Number(userId),
        to: Number(toId),
        body: body.trim(),
      },
    })

    return NextResponse.json({ success: true, id: message.id })
  } catch (err) {
    console.error('[messages/send]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
