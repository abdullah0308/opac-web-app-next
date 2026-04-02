import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/seed-attendance
 * Seeds training sessions (Saturdays + Sundays for the past 6 weeks) and
 * attendance records for all archers, plus realistic scores for the leaderboard.
 * Safe to run multiple times (skips existing records).
 */

// Past 6 Saturdays and Sundays from 2026-04-02
const TRAINING_DATES = [
  '2026-03-28', '2026-03-29',
  '2026-03-21', '2026-03-22',
  '2026-03-14', '2026-03-15',
  '2026-03-07', '2026-03-08',
  '2026-02-28', '2026-03-01',
  '2026-02-21', '2026-02-22',
]

// Attendance pattern: not every archer makes every session (realistic variation)
// archerId → bitmask of which sessions they attended (index into TRAINING_DATES)
const ATTENDANCE_PATTERN: Record<string, number[]> = {
  AM0032: [0,1,2,3,4,5,6,7,8,9,10,11],      // always present
  FL0018: [0,1,2,3,4,5,6,7,8,10],            // misses 2
  RM0001: [0,2,4,5,6,8,9,10],                // beginners come less often
  ST0042: [1,3,4,5,7,8,9,11],
  KP0015: [0,1,2,3,6,7,8,9,10,11],
  NB0007: [0,1,3,5,7,9,11],
  MC0023: [0,1,2,4,5,6,8,9,10],
  JD0055: [0,1,2,3,4,5,6,7,8,9,10,11],       // always present
}

// Realistic scores per archer (720 round, multiple sessions)
const SCORE_DATA: Record<string, number[]> = {
  AM0032: [612, 634, 628, 641, 619, 655],
  FL0018: [488, 502, 495, 511, 484, 520],
  RM0001: [248, 265, 271, 258, 283, 290],
  ST0042: [231, 247, 252, 261, 268, 275],
  KP0015: [445, 461, 453, 472, 467, 485],
  NB0007: [210, 228, 235, 243, 250, 258],
  MC0023: [398, 412, 421, 408, 435, 443],
  JD0055: [578, 591, 604, 597, 615, 622],
}

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const results: Record<string, unknown> = {}

    // 1. Find all archers by archerId
    const archerIds = Object.keys(ATTENDANCE_PATTERN)
    const archerMap: Record<string, string | number> = {}
    for (const aid of archerIds) {
      const r = await payload.find({ collection: 'users', where: { archerId: { equals: aid } }, limit: 1 })
      if (r.docs[0]) archerMap[aid] = r.docs[0].id
    }

    // 2. Create sessions for each training date
    const sessionMap: Record<string, string | number> = {}
    let sessionsCreated = 0
    for (const date of TRAINING_DATES) {
      const existing = await payload.find({
        collection: 'sessions',
        where: { date: { equals: `${date}T00:00:00.000Z` } },
        limit: 1,
      })
      if (existing.docs[0]) {
        sessionMap[date] = existing.docs[0].id
      } else {
        const d = new Date(`${date}T00:00:00.000Z`)
        const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        const session = await payload.create({
          collection: 'sessions',
          data: { name: `Training — ${label}`, date: `${date}T00:00:00.000Z`, active: false },
        })
        sessionMap[date] = session.id
        sessionsCreated++
      }
    }
    results.sessionsCreated = sessionsCreated

    // 3. Create attendance records
    let attendanceCreated = 0
    for (const [aid, sessionIdxs] of Object.entries(ATTENDANCE_PATTERN)) {
      const archPayloadId = archerMap[aid]
      if (!archPayloadId) continue
      for (const idx of sessionIdxs) {
        const date = TRAINING_DATES[idx]
        const sessionId = sessionMap[date]
        if (!sessionId) continue
        const dup = await payload.find({
          collection: 'attendance',
          where: {
            and: [
              { archer: { equals: String(archPayloadId) } },
              { session: { equals: String(sessionId) } },
            ],
          },
          limit: 1,
        })
        if (dup.docs[0]) continue
        await payload.create({
          collection: 'attendance',
          data: {
            archer: archPayloadId as string,
            session: sessionId as string,
            method: 'qr',
            status: 'present',
            timestamp: `${date}T08:30:00.000Z`,
          },
        })
        attendanceCreated++
      }
    }
    results.attendanceCreated = attendanceCreated

    // 4. Create scores
    let scoresCreated = 0
    for (const [aid, scores] of Object.entries(SCORE_DATA)) {
      const archPayloadId = archerMap[aid]
      if (!archPayloadId) continue
      const existing = await payload.find({
        collection: 'scores',
        where: { archer: { equals: archPayloadId } },
        limit: 1,
      })
      if (existing.docs.length > 0) continue // already has scores
      for (let i = 0; i < scores.length; i++) {
        const date = TRAINING_DATES[i * 2] ?? TRAINING_DATES[0]
        await payload.create({
          collection: 'scores',
          data: {
            archer: archPayloadId as string,
            roundType: 'training',
            scoringFormat: '720',
            points: scores[i],
            maxPoints: 720,
            date: `${date}T09:00:00.000Z`,
            roundScores: Array.from({ length: 12 }, () =>
              Array.from({ length: 6 }, () => Math.floor(scores[i] / 72))
            ),
          },
        })
        scoresCreated++
      }
    }
    results.scoresCreated = scoresCreated

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[seed-attendance]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
