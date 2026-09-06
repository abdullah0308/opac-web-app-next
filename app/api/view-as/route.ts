import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { getWards, WARD_COOKIE_NAME } from '@/lib/viewer'

/**
 * POST /api/view-as  { archerId: string | null }
 *
 * Switches a guardian into one of their children's accounts, or back to their
 * own when archerId is null. The guardian link is verified here as well as on
 * every read, so a forged cookie gets nobody anywhere.
 */
export async function POST(req: NextRequest) {
  const viewerId = await getCurrentUserId()
  if (!viewerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { archerId } = (await req.json()) as { archerId?: string | null }

  const res = NextResponse.json({ success: true, viewingAs: archerId ?? null })

  if (!archerId) {
    res.cookies.delete(WARD_COOKIE_NAME)
    return res
  }

  const wards = await getWards(viewerId)
  if (!wards.some((w) => w.id === String(archerId))) {
    return NextResponse.json(
      { error: 'You are not listed as a guardian for that archer.' },
      { status: 403 },
    )
  }

  res.cookies.set(WARD_COOKIE_NAME, String(archerId), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  })
  return res
}
