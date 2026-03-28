import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { pushDevSchema } from '@payloadcms/drizzle'

/**
 * POST /api/db-push
 * Pushes the Payload schema to the connected database (Drizzle push).
 * Protected by ADMIN_SECRET header. Run once after first deploy.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    // Temporarily bypass NODE_ENV check by calling pushDevSchema directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await pushDevSchema(payload.db as any)
    return NextResponse.json({ success: true, message: 'Schema pushed to database.' })
  } catch (err) {
    console.error('[db-push]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
