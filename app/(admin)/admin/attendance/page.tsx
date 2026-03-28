import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'
import AttendanceSettingsClient from './AttendanceSettingsClient'

export const metadata = { title: 'Attendance Settings — OPAC Admin' }

export default async function AdminAttendancePage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  // Load active sessions
  const sessionsResult = await payload.find({
    collection: 'sessions',
    where: { active: { equals: true } },
    sort: 'date',
    limit: 20,
  })
  const sessions = sessionsResult.docs

  // Global settings for face recognition toggle
  let faceEnabled = false
  try {
    const settings = await payload.findGlobal({ slug: 'global-settings' })
    faceEnabled = settings?.faceRecognitionEnabled as boolean ?? false
  } catch {
    // global settings may not exist yet
  }

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[24px] text-opac-ink">Attendance Settings</h1>
      </div>

      <AttendanceSettingsClient faceEnabled={faceEnabled} />

      {/* Active sessions */}
      <div>
        <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">Active Sessions</p>
        {sessions.length === 0 ? (
          <div className="bg-white rounded-[16px] p-6 border border-opac-border text-center">
            <p className="font-body text-[14px] text-opac-ink-60">No active sessions.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session: { id: string | number; name?: string; date?: string; qrCode?: string; active?: boolean }) => (
              <div key={String(session.id)} className="bg-white rounded-[14px] px-4 py-3.5 border border-opac-border flex items-center justify-between">
                <div>
                  <p className="font-body text-[14px] font-semibold text-opac-ink">{session.name ?? 'Session'}</p>
                  {session.date && (
                    <p className="font-body text-[12px] text-opac-ink-60">
                      {new Date(session.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {session.qrCode && (
                    <span className="font-body text-[11px] text-opac-green bg-opac-green-light px-2.5 py-0.5 rounded-full">QR Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
