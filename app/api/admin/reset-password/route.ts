import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId, getUserRoles } from '@/lib/auth'
import { sendEmail, renderEmail } from '@/lib/email'

/**
 * POST /api/admin/reset-password  { userId, password }
 *
 * Members are created by an admin, so recovery runs through an admin too: set
 * a new password here and the member is emailed to say it changed. This is the
 * stop-gap until self-service reset is wired to a verified mail domain.
 */
export async function POST(req: NextRequest) {
  const adminId = await getCurrentUserId()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const roles = await getUserRoles()
  if (!roles.includes('admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { userId, password } = (await req.json()) as {
      userId?: string
      password?: string
    }
    if (!userId || !password) {
      return NextResponse.json(
        { error: 'userId and password are required' },
        { status: 400 },
      )
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Use at least 8 characters.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const user = (await payload
      .findByID({ collection: 'users', id: userId, depth: 0 })
      .catch(() => null)) as { email?: string; name?: string } | null
    if (!user) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    await payload.update({
      collection: 'users',
      id: userId,
      overrideAccess: true,
      data: { password },
    })

    let emailed = false
    if (user.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
      const result = await sendEmail({
        to: user.email,
        subject: 'Your OPAC password was reset',
        html: renderEmail({
          heading: 'Your password was reset',
          intro: `Hi ${user.name ?? 'there'}, a club admin has set a new password on your OPAC account. Ask them for it, then sign in and change it whenever you like.`,
          ctaLabel: appUrl ? 'Sign in' : undefined,
          ctaHref: appUrl ? `${appUrl}/login` : undefined,
          outro: 'If you did not expect this, tell a committee member straight away.',
        }),
      })
      emailed = result.sent
    }

    return NextResponse.json({ success: true, emailed })
  } catch (err) {
    console.error('[admin/reset-password]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
