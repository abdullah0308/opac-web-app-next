import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/seed-update
 * Creates AM0032 if missing. Safe to run multiple times.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const results: Record<string, string> = {}

    // Resolve Wolves clan id
    const wolvesResult = await payload.find({
      collection: 'clans',
      where: { name: { equals: 'Wolves' } },
      limit: 1,
      overrideAccess: true,
    })
    const wolvesId = wolvesResult.docs[0]?.id
    if (!wolvesId) return NextResponse.json({ error: 'Wolves clan not found — run /api/seed first' }, { status: 400 })

    // Create AM0032 if not already there
    const existing = await payload.find({
      collection: 'users',
      where: { archerId: { equals: 'AM0032' } },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0) {
      results['AM0032'] = 'already exists'
    } else {
      await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          archerId: 'AM0032',
          name: 'Abdullah Mohamed',
          email: 'am0032@opac.app',
          password: '0P@C26',
          roles: ['archer', 'coach', 'admin'],
          active: true,
          faceEnrolled: false,
          setupComplete: true,
          bowType: 'recurve',
          level: 'elite',
          gender: 'male',
          clanId: wolvesId,
          dateOfBirth: '2003-08-03T00:00:00.000Z',
        },
      })
      results['AM0032'] = 'created'
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[seed-update]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
