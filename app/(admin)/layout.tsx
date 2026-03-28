import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', emoji: '📊' },
  { href: '/admin/users', label: 'Users', emoji: '👥' },
  { href: '/admin/payments', label: 'Payments', emoji: '💳' },
  { href: '/admin/clans', label: 'Clans', emoji: '🛡️' },
  { href: '/admin/pathways', label: 'Pathways', emoji: '🎯' },
  { href: '/admin/attendance', label: 'Attendance', emoji: '📋' },
  { href: '/admin/forum', label: 'Forum', emoji: '💬' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole('admin')

  return (
    <div className="phone-frame flex">
      <RoleSync />
      {/* Side drawer */}
      <div className="w-[220px] flex-shrink-0 bg-opac-green-dark flex flex-col py-6">
        <div className="px-5 mb-6">
          <p className="font-display text-[20px] text-white">OPAC</p>
          <p className="font-body text-[12px] text-[rgba(255,255,255,0.5)] mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map(({ href, label, emoji }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors">
              <span className="text-[16px]">{emoji}</span>
              <span className="font-body text-[14px] font-semibold">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-opac-bg">{children}</main>
    </div>
  )
}
