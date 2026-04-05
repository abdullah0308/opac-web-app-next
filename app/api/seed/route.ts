import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const CLANS = [
  { name: 'Wolves', colour: '#6B7280' },
  { name: 'Lions',  colour: '#F59E0B' },
  { name: 'Bears',  colour: '#92400E' },
  { name: 'Eagles', colour: '#2563EB' },
]

const USERS = [
  {
    archerId: 'IB0035', name: 'Izz Shahaziq Bin Helmi Johan', email: 'ib0035@opac.app',
    bowType: 'recurve', level: 'elite', clan: 'Wolves',
    roles: ['archer', 'admin'], gender: 'male',
    dateOfBirth: '1998-09-29T00:00:00.000Z',
  },
  {
    archerId: 'FL0018', name: 'Farhaan Lalloo', email: 'fl0018@opac.app',
    bowType: 'recurve', level: 'intermediate', clan: 'Wolves',
    roles: ['archer', 'coach'], gender: 'male',
    dateOfBirth: '2005-05-06T00:00:00.000Z',
  },
  {
    archerId: 'CB0054', name: 'Cochowouth-Azeer Bibi Tehziba', email: 'cb0054@opac.app',
    bowType: 'recurve', level: 'intermediate', clan: 'Wolves',
    roles: ['archer'], gender: 'female',
  },
  {
    archerId: 'ZB0025', name: 'Zaydaan Baubooa', email: 'zb0025@opac.app',
    bowType: 'recurve', level: 'elite', clan: 'Bears',
    roles: ['archer'], gender: 'male',
    dateOfBirth: '2004-12-20T00:00:00.000Z',
  },
  {
    archerId: 'DD0118', name: 'Deevesh Dabee', email: 'dd0118@opac.app',
    bowType: 'recurve', level: 'elite', clan: 'Eagles',
    roles: ['archer'], gender: 'male',
    dateOfBirth: '2002-01-19T00:00:00.000Z',
  },
  {
    archerId: 'HB0007', name: 'Habibah Bhollah', email: 'hb0007@opac.app',
    bowType: 'recurve', level: 'intermediate', clan: 'Lions',
    roles: ['archer'], gender: 'female',
  },
]

/**
 * GET /api/seed
 * Wipes all data then seeds 4 clans + 6 real archers.
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const results: Record<string, string> = {}

    // ── 1. Wipe all data ────────────────────────────────────────────────────
    const collections = ['scores', 'attendance', 'payments', 'messages', 'forum-posts', 'sessions', 'users', 'clans'] as const
    for (const col of collections) {
      const all = await payload.find({ collection: col, limit: 1000, overrideAccess: true })
      for (const doc of all.docs) {
        await payload.delete({ collection: col, id: doc.id, overrideAccess: true })
      }
      results[`wipe:${col}`] = `deleted ${all.docs.length}`
    }

    // ── 2. Create clans ─────────────────────────────────────────────────────
    const clanIds: Record<string, string | number> = {}
    for (const clan of CLANS) {
      const created = await payload.create({
        collection: 'clans',
        overrideAccess: true,
        data: { name: clan.name, colour: clan.colour, points: 0, season: '2026' },
      })
      clanIds[clan.name] = created.id
      results[`clan:${clan.name}`] = 'created'
    }

    // ── 3. Create users ─────────────────────────────────────────────────────
    for (const u of USERS) {
      await payload.create({
        collection: 'users',
        overrideAccess: true,
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
          clanId: clanIds[u.clan],
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
