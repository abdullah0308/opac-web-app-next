import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/opac'

export const metadata = { title: 'Attendance — OPAC' }

export default async function AttendancePage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: userId }).catch(() => null)
  if (!user) redirect('/login')

  // Get last 30 days of attendance
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const attendanceResult = await payload.find({
    collection: 'attendance',
    where: {
      and: [
        { archer: { equals: user.id } },
        { timestamp: { greater_than_equal: thirtyDaysAgo.toISOString() } },
      ],
    },
    sort: '-timestamp',
    limit: 50,
  })
  type AttendanceDoc = { id: string | number; timestamp?: string; status?: string; method?: string; session?: { name?: string } | string | null }
  const records = attendanceResult.docs as unknown as AttendanceDoc[]

  const presentCount = records.filter((r) => r.status === 'present').length
  const totalSessions = records.length

  return (
    <>
      <ScreenHeader title="Attendance" />

      <div className="p-5 flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-[14px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[24px] font-semibold text-opac-green">{presentCount}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Sessions</p>
          </div>
          <div className="bg-white rounded-[14px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[24px] font-semibold text-opac-ink">
              {totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0}%
            </p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Rate</p>
          </div>
          <div className="bg-white rounded-[14px] p-3.5 border border-opac-border text-center">
            <p className="font-mono text-[24px] font-semibold text-opac-ink">{totalSessions}</p>
            <p className="font-body text-[11px] text-opac-ink-60 mt-0.5">Total</p>
          </div>
        </div>

        {/* Records list */}
        <div>
          <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">
            Last 30 days
          </p>
          {records.length === 0 ? (
            <div className="bg-white rounded-[16px] p-8 border border-opac-border text-center">
              <p className="font-body text-[15px] text-opac-ink-60">No attendance records yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {records.map((record) => {
                const date = record.timestamp
                  ? new Date(record.timestamp).toLocaleDateString('en-GB', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    })
                  : '—'
                const time = record.timestamp
                  ? new Date(record.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                  : ''
                const sessionName =
                  typeof record.session === 'object' && record.session !== null
                    ? (record.session as { name?: string }).name ?? 'Session'
                    : 'Session'

                return (
                  <div key={record.id} className="bg-white rounded-[14px] px-4 py-3 border border-opac-border flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${record.status === 'present' ? 'bg-opac-success' : 'bg-opac-error'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[14px] font-semibold text-opac-ink">{sessionName}</p>
                      <p className="font-body text-[12px] text-opac-ink-60">{date} · {time}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        record.status === 'present'
                          ? 'bg-[#DCFCE7] text-[#16A34A]'
                          : 'bg-[#FEE2E2] text-[#DC2626]'
                      }`}>
                        {record.status ?? 'unknown'}
                      </span>
                      {record.method && (
                        <span className="text-[10px] text-opac-ink-30 capitalize">{record.method}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
