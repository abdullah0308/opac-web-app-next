import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentUserId } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { roundType, scoringFormat, points, maxPoints, roundScores, date } = body

    if (!roundType || points == null) {
      return NextResponse.json({ error: 'roundType and points are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const score = await payload.create({
      collection: 'scores',
      overrideAccess: true,
      data: {
        archer: Number(userId),
        roundType,
        scoringFormat,
        points,
        maxPoints,
        roundScores,
        date: date ?? new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true, id: score.id })
  } catch (err) {
    console.error('[scores/submit]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
