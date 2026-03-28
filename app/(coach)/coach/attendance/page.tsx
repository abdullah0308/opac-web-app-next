import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Attendance Monitor — OPAC Coach' }

export default async function CoachAttendancePage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  // Today's attendance records
  const today = new Date().toISOString().split('T')[0]
  const todayResult = await payload.find({
    collection: 'attendance',
    where: {
      timestamp: { greater_than_equal: `${today}T00:00:00.000Z` },
    },
    sort: '-timestamp',
    limit: 100,
  })
  type AttendanceDoc = { id: string | number; status?: string; method?: string; timestamp?: string; archer?: { id?: string | number; name?: string } | string }
  const todayRecords = todayResult.docs as unknown as AttendanceDoc[]

  // Active archers
  const archersResult = await payload.find({
    collection: 'users',
    where: {
      and: [
        { roles: { contains: 'archer' } },
        { active: { equals: true } },
      ],
    },
    limit: 200,
  })
  const totalArchers = archersResult.totalDocs

  const presentIds = new Set(
    todayRecords
      .filter((r) => r.status === 'present')
      .map((r) =>
        typeof r.archer === 'object' && r.archer !== null
          ? String((r.archer as { id?: string | number }).id)
          : String(r.archer)
      )
  )
  const presentCount = presentIds.size
  const absentCount = totalArchers - presentCount

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <>
      <ScreenHeader title="Attendance" subtitle={todayFormatted} />

      <div className="p-5 flex flex-col gap-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-[14px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[26px] font-semibold text-opac-green">{presentCount}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Present</p>
          </div>
          <div className="bg-white rounded-[14px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[26px] font-semibold text-opac-error">{absentCount}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Absent</p>
          </div>
          <div className="bg-white rounded-[14px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[26px] font-semibold text-opac-ink">{totalArchers}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Total</p>
          </div>
        </div>

        {/* Present archers */}
        {todayRecords.length > 0 && (
          <div>
            <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">
              Present Today
            </p>
            <div className="flex flex-col gap-2">
              {todayRecords
                .filter((r) => r.status === 'present')
                .map((record) => {
                  const archerName =
                    typeof record.archer === 'object' && record.archer !== null
                      ? (record.archer as { name?: string }).name ?? 'Archer'
                      : 'Archer'
                  const initials = archerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  const timeStr = record.timestamp
                    ? new Date(record.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                    : ''

                  return (
                    <div key={record.id} className="bg-white rounded-[14px] px-4 py-3 border border-opac-border flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-opac-green-light flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-[12px] text-opac-green">{initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-[14px] font-semibold text-opac-ink">{archerName}</p>
                        <p className="font-body text-[12px] text-opac-ink-60 capitalize">
                          {record.method ?? 'manual'} · {timeStr}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-opac-success" />
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {todayRecords.length === 0 && (
          <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
            <p className="font-body text-[15px] text-opac-ink-60">No attendance recorded today yet.</p>
          </div>
        )}
      </div>
    </>
  )
}
