import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/seed-update
 * Updates the existing AM0032 user with full profile data.
 * Also creates the Wolves clan if it does not exist.
 * Safe to run multiple times.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Ensure Wolves clan exists
    const clanResult = await payload.find({
      collection: 'clans',
      where: { name: { equals: 'Wolves' } },
      limit: 1,
    })
    let clanId: string | number
    if (clanResult.docs.length > 0) {
      clanId = clanResult.docs[0].id
    } else {
      const clan = await payload.create({
        collection: 'clans',
        data: { name: 'Wolves', colour: '#6B7280', points: 0, season: '2026' },
      })
      clanId = clan.id
    }

    // Find AM0032
    const existing = await payload.find({
      collection: 'users',
      where: { archerId: { equals: 'AM0032' } },
      limit: 1,
    })

    if (existing.docs.length === 0) {
      return NextResponse.json({ error: 'User AM0032 not found. Run /api/seed first.' }, { status: 404 })
    }

    const userId = existing.docs[0].id

    // Patch all profile fields
    const updated = await payload.update({
      collection: 'users',
      id: userId,
      data: {
        setupComplete: true,
        bowType: 'recurve',
        gender: 'male',
        phone: '59102080',
        dateOfBirth: '2003-08-03T00:00:00.000Z',
        clan: clanId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'AM0032 profile updated successfully.',
      id: updated.id,
      clanId,
    })
  } catch (err) {
    console.error('[seed-update]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
