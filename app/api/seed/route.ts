import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/seed
 * Creates the initial AM0032 user if they do not already exist.
 * Run once after first deploy / database reset.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Check if AM0032 already exists
    const existing = await payload.find({
      collection: 'users',
      where: { archerId: { equals: 'AM0032' } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json({
        message: 'User AM0032 already exists — no action taken.',
        id: existing.docs[0].id,
      })
    }

    // Create the user — Payload hashes the password automatically
    const user = await payload.create({
      collection: 'users',
      data: {
        archerId: 'AM0032',
        name: 'Admin Archer',
        email: 'am0032@opac.app',
        password: '0P@C26',
        roles: ['archer', 'coach', 'admin'],
        active: true,
        faceEnrolled: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User AM0032 created successfully.',
      id: user.id,
    })
  } catch (err) {
    console.error('[seed]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
