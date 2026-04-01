import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/seed
 * Idempotent full seed: creates 4 clans + 8 users (skips any that already exist).
 * Safe to run multiple times.
 */

const CLANS = [
  { name: 'Wolves', colour: '#6B7280' },
  { name: 'Lions',  colour: '#F59E0B' },
  { name: 'Bears',  colour: '#92400E' },
  { name: 'Eagles', colour: '#2563EB' },
]

const USERS = [
  {
    archerId: 'AM0032', name: 'Abdullah Mohamed', email: 'am0032@opac.app',
    bowType: 'recurve', level: 'elite', clan: 'Wolves',
    roles: ['archer', 'coach', 'admin'], gender: 'male',
    phone: '59102080', dateOfBirth: '2003-08-03T00:00:00.000Z',
  },
  {
    archerId: 'FL0018', name: 'Farhaan Lalloo', email: 'fl0018@opac.app',
    bowType: 'recurve', level: 'intermediate', clan: 'Wolves',
    roles: ['archer'], gender: 'male',
  },
  {
    archerId: 'RM0001', name: 'Rohan Mungur', email: 'rm0001@opac.app',
    bowType: 'recurve', level: 'beginner', clan: 'Bears',
    roles: ['archer'], gender: 'male',
  },
  {
    archerId: 'ST0042', name: 'Sara Thacoor', email: 'st0042@opac.app',
    bowType: 'compound', level: 'beginner', clan: 'Lions',
    roles: ['archer'], gender: 'female',
  },
  {
    archerId: 'KP0015', name: 'Karan Patten', email: 'kp0015@opac.app',
    bowType: 'recurve', level: 'intermediate', clan: 'Eagles',
    roles: ['archer'], gender: 'male',
  },
  {
    archerId: 'NB0007', name: 'Nadia Bheekhun', email: 'nb0007@opac.app',
    bowType: 'recurve', level: 'beginner', clan: 'Wolves',
    roles: ['archer'], gender: 'female',
  },
  {
    archerId: 'MC0023', name: 'Marcus Céleste', email: 'mc0023@opac.app',
    bowType: 'compound', level: 'intermediate', clan: 'Bears',
    roles: ['archer'], gender: 'male',
  },
  {
    archerId: 'JD0055', name: 'Jade Doubrova', email: 'jd0055@opac.app',
    bowType: 'recurve', level: 'elite', clan: 'Lions',
    roles: ['archer'], gender: 'female',
  },
]

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const results: Record<string, string> = {}

    // 1. Ensure all 4 clans exist
    const clanIds: Record<string, string | number> = {}
    for (const clan of CLANS) {
      const existing = await payload.find({
        collection: 'clans',
        where: { name: { equals: clan.name } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        clanIds[clan.name] = existing.docs[0].id
        results[`clan:${clan.name}`] = 'already exists'
      } else {
        const created = await payload.create({
          collection: 'clans',
          data: { name: clan.name, colour: clan.colour, points: 0, season: '2026' },
        })
        clanIds[clan.name] = created.id
        results[`clan:${clan.name}`] = 'created'
      }
    }

    // 2. Ensure all 8 users exist
    for (const u of USERS) {
      const existing = await payload.find({
        collection: 'users',
        where: { archerId: { equals: u.archerId } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        results[`user:${u.archerId}`] = 'already exists'
        continue
      }
      await payload.create({
        collection: 'users',
        data: {
          archerId: u.archerId,
          name: u.name,
          email: u.email,
          password: '0P@C26',
          roles: u.roles as ('archer' | 'coach' | 'admin')[],
          active: true,
          faceEnrolled: false,
          setupComplete: true,
          bowType: u.bowType as 'recurve' | 'compound' | 'barebow',
          level: u.level as 'beginner' | 'intermediate' | 'elite',
          gender: u.gender as 'male' | 'female' | 'other',
          clan: clanIds[u.clan],
          ...(u.phone ? { phone: u.phone } : {}),
          ...(u.dateOfBirth ? { dateOfBirth: u.dateOfBirth } : {}),
        },
      })
      results[`user:${u.archerId}`] = 'created'
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[seed]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
