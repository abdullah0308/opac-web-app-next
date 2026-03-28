import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * GET /api/reset-db
 * Deletes dev.db so Payload recreates the schema fresh on next request.
 * Development only — remove before deploying to production.
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const dirname = path.dirname(fileURLToPath(import.meta.url))
  // Walk up from app/api/reset-db to project root
  const dbPath = path.resolve(dirname, '../../../../dev.db')

  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
      return NextResponse.json({
        success: true,
        message: 'dev.db deleted. Restart the dev server, then visit /api/seed.',
        next: ['1. Stop dev server (Ctrl+C)', '2. npm run dev', '3. GET /api/seed'],
      })
    } else {
      return NextResponse.json({ message: 'dev.db not found — already clean.' })
    }
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      hint: 'The DB file may be locked. Stop the dev server, delete dev.db manually, then restart.',
    }, { status: 500 })
  }
}
