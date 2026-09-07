import { getPayload } from 'payload'
import config from '@payload-config'
import { relId } from './relId'

/**
 * Attendance points.
 *
 * Every time an archer is marked present, they earn the rate set in Global
 * Settings. The ledger row is keyed to the attendance record via batchId, so
 * awarding twice for the same check-in is impossible and removing the
 * attendance can remove the points with it.
 */

function attendanceBatchId(attendanceId: string | number) {
  return `attendance:${attendanceId}`
}

export async function awardAttendancePoints(opts: {
  attendanceId: string | number
  archerId: string | number
  date?: string
}): Promise<number> {
  const payload = await getPayload({ config })

  const settings = (await payload
    .findGlobal({ slug: 'global-settings' })
    .catch(() => null)) as { season?: string; pointsPerAttendance?: number } | null

  const rate = settings?.pointsPerAttendance ?? 1
  if (rate <= 0) return 0

  const season = settings?.season ?? String(new Date().getFullYear())
  const batchId = attendanceBatchId(opts.attendanceId)

  // Idempotent: one ledger row per attendance record, ever.
  const existing = await payload
    .find({
      collection: 'points-entries',
      where: { batchId: { equals: batchId } },
      limit: 1,
      depth: 0,
    })
    .catch(() => null)
  if (existing && existing.docs.length > 0) return 0

  await payload.create({
    collection: 'points-entries',
    overrideAccess: true,
    data: {
      archer: relId(opts.archerId) as string,
      source: 'attendance',
      points: rate,
      eventName: 'Session attendance',
      date: opts.date ?? new Date().toISOString(),
      season,
      batchId,
    },
  })

  return rate
}

/** Removes the attendance points tied to an attendance record. */
export async function revokeAttendancePoints(
  attendanceId: string | number,
): Promise<void> {
  const payload = await getPayload({ config })
  const batchId = attendanceBatchId(attendanceId)
  const rows = await payload
    .find({
      collection: 'points-entries',
      where: { batchId: { equals: batchId } },
      limit: 10,
      depth: 0,
    })
    .catch(() => null)
  if (!rows) return
  for (const row of rows.docs) {
    await payload
      .delete({ collection: 'points-entries', id: row.id, overrideAccess: true })
      .catch(() => null)
  }
}
