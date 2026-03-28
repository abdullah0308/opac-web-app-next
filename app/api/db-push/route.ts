import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/db-push
 * Verifies the database connection and schema by attempting a simple query.
 * To initialize the schema, run the dev server locally with DATABASE_URL set —
 * Payload will auto-push the schema via pushDevSchema on first startup.
 * Protected by ADMIN_SECRET header.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret')
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const count = await payload.count({ collection: 'users' })
    return NextResponse.json({
      success: true,
      message: 'Database connected and schema verified.',
      userCount: count.totalDocs,
    })
  } catch (err) {
    console.error('[db-push]', err)
    return NextResponse.json({
      error: String(err),
      hint: 'Run `npm run dev` locally with DATABASE_URL set to push the schema to Neon.',
    }, { status: 500 })
  }
}
