import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import AttendanceManagerClient from './AttendanceManagerClient'

export const metadata = { title: 'Attendance — OPAC Admin' }

export default async function AdminAttendancePage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  const [sessionsResult, usersResult] = await Promise.all([
    payload.find({
      collection: 'sessions',
      sort: '-date',
      limit: 30,
    }),
    payload.find({
      collection: 'users',
      where: { and: [{ active: { equals: true } }, { roles: { contains: 'archer' } }] },
      limit: 100,
    }),
  ])

  type SessionDoc = { id: string | number; name?: string; date?: string; active?: boolean }
  type ArcherDoc = { id: string | number; name?: string; archerId?: string }

  const sessions = sessionsResult.docs as unknown as SessionDoc[]
  const archers = usersResult.docs as unknown as ArcherDoc[]

  // For each session, load attendance
  const attendanceMap: Record<string, string[]> = {}
  if (sessions.length > 0) {
    const attendanceResult = await payload.find({
      collection: 'attendance',
      where: {
        session: { in: sessions.map(s => String(s.id)) },
      },
      limit: 500,
    })
    for (const rec of attendanceResult.docs) {
      const sid = typeof rec.session === 'object' && rec.session !== null
        ? String((rec.session as { id?: string | number }).id)
        : String(rec.session)
      const aid = typeof rec.archer === 'object' && rec.archer !== null
        ? String((rec.archer as { id?: string | number }).id)
        : String(rec.archer)
      if (!attendanceMap[sid]) attendanceMap[sid] = []
      attendanceMap[sid].push(aid)
    }
  }

  return (
    <AttendanceManagerClient
      sessions={sessions.map(s => ({
        id: String(s.id),
        name: s.name ?? 'Session',
        date: s.date ?? '',
        active: s.active ?? false,
        presentIds: attendanceMap[String(s.id)] ?? [],
      }))}
      archers={archers.map(a => ({ id: String(a.id), name: a.name ?? 'Archer', archerId: a.archerId ?? '' }))}
    />
  )
}
