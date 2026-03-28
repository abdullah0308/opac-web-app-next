import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/auth/login
 * Body: { archerId: string, password: string }
 *
 * Looks up the user by archerId, authenticates via Payload,
 * and sets an HTTP-only `payload-token` cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { archerId, password } = body as { archerId?: string; password?: string }

    if (!archerId || !password) {
      return NextResponse.json(
        { error: 'Archer ID and password are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Find user by archerId
    const result = await payload.find({
      collection: 'users',
      where: { archerId: { equals: archerId.toUpperCase() } },
      limit: 1,
    })

    const user = result.docs[0] as { id: string | number; email?: string; name?: string; roles?: string[]; archerId?: string } | undefined
    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'Invalid Archer ID or password' },
        { status: 401 }
      )
    }

    // Verify password via Payload's built-in login
    const loginResult = await payload.login({
      collection: 'users',
      data: { email: user.email, password },
    })

    if (!loginResult.token || !loginResult.user) {
      return NextResponse.json(
        { error: 'Invalid Archer ID or password' },
        { status: 401 }
      )
    }

    const loggedInUser = loginResult.user as { id: string | number; name?: string; archerId?: string; roles?: string[] }
    const response = NextResponse.json({
      success: true,
      user: {
        id: loggedInUser.id,
        name: loggedInUser.name,
        archerId: loggedInUser.archerId,
        roles: loggedInUser.roles ?? ['archer'],
      },
    })

    // Set HTTP-only session cookie
    response.cookies.set('payload-token', loginResult.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (err) {
    console.error('[auth/login]', err)
    // Return generic error to avoid leaking details
    return NextResponse.json(
      { error: 'Invalid Archer ID or password' },
      { status: 401 }
    )
  }
}
