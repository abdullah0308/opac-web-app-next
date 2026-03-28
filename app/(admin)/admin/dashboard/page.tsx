import { getCurrentUserId } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Admin Dashboard — OPAC' }

export default async function AdminDashboardPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  const payload = await getPayload({ config })

  const [archersRes, scoresRes, paymentsRes, attRes] = await Promise.all([
    payload.find({ collection: 'users', where: { active: { equals: true } }, limit: 1 }),
    payload.find({ collection: 'scores', limit: 1 }),
    payload.find({ collection: 'payments', where: { status: { equals: 'overdue' } }, limit: 1 }),
    payload.find({
      collection: 'attendance',
      where: {
        timestamp: { greater_than_equal: new Date(Date.now() - 86400000).toISOString() },
      },
      limit: 1,
    }),
  ])

  const stats = [
    { label: 'Active Members', value: archersRes.totalDocs, color: 'text-opac-green' },
    { label: 'Total Scores', value: scoresRes.totalDocs, color: 'text-opac-ink' },
    { label: 'Overdue Payments', value: paymentsRes.totalDocs, color: 'text-opac-error' },
    { label: 'Attendance (24h)', value: attRes.totalDocs, color: 'text-opac-gold' },
  ]

  return (
    <div className="p-6 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[26px] text-opac-ink">Dashboard</h1>
        <p className="font-body text-[13px] text-opac-ink-60 mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-[16px] p-4 border border-opac-border">
            <p className={`font-mono text-[32px] font-semibold ${color}`}>{value}</p>
            <p className="font-body text-[13px] text-opac-ink-60 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[16px] p-5 border border-opac-border">
        <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-3">Quick Actions</p>
        <div className="flex flex-col gap-2">
          {[
            { href: '/admin/users', label: 'Manage members' },
            { href: '/admin/payments', label: 'View overdue payments' },
            { href: '/admin/attendance', label: 'Attendance settings' },
            { href: '/admin/forum', label: 'Forum moderation' },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              className="flex items-center justify-between py-2 border-b border-opac-border last:border-0">
              <span className="font-body text-[14px] text-opac-ink">{label}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="#ADADAA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
