import { NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clears the payload-token cookie and redirects to /login.
 */
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('payload-token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
