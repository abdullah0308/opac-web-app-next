import { NextResponse } from 'next/server'

/**
 * Guard for destructive maintenance endpoints (seeding, schema pushes).
 *
 * These routes wipe or rewrite whole collections, so they must never be
 * reachable from a deployed URL. Two locks: never in production, and an
 * ADMIN_SECRET header even in development.
 *
 * Returns a response to send back when the request is not allowed, or null
 * when the caller may proceed.
 */
export function guardMaintenanceRoute(req: Request): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Maintenance routes are disabled in production.' },
      { status: 404 },
    )
  }

  const secret = process.env.ADMIN_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET is not configured; refusing to run.' },
      { status: 403 },
    )
  }

  const provided =
    req.headers.get('x-admin-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
