import { NextResponse } from 'next/server'
import { Pool } from 'pg'

/**
 * GET /api/db-migrate
 * Adds any missing columns to the Neon DB that were added after initial schema push.
 * Safe to run multiple times (uses IF NOT EXISTS / DO NOTHING).
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'No DATABASE_URL configured' }, { status: 500 })
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const results: string[] = []

  try {
    // Add level column to users table if missing
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS level varchar(64)
    `)
    results.push('users.level: added or already exists')

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[db-migrate]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  } finally {
    await pool.end()
  }
}
