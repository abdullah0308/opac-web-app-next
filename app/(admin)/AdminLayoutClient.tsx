'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  Users,
  CreditCard,
  Shield,
  Map,
  CalendarCheck,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard',  Icon: BarChart2     },
  { href: '/admin/users',      label: 'Users',       Icon: Users         },
  { href: '/admin/payments',   label: 'Payments',    Icon: CreditCard    },
  { href: '/admin/clans',      label: 'Clans',       Icon: Shield        },
  { href: '/admin/pathways',   label: 'Pathways',    Icon: Map           },
  { href: '/admin/attendance', label: 'Attendance',  Icon: CalendarCheck },
  { href: '/admin/forum',      label: 'Forum',       Icon: MessageSquare },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navContent = (
    <nav className="flex flex-col gap-1 px-3 mt-2">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] transition-colors ${
              active
                ? 'bg-[rgba(255,255,255,0.18)] text-white'
                : 'text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span className="font-body text-[14px] font-semibold">{label}</span>
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="phone-frame flex h-full">
      {/* ── Desktop sidebar (md+) ─────────────────────────────────── */}
      <div className="hidden md:flex w-[220px] flex-shrink-0 bg-opac-green-dark flex-col py-6">
        <div className="px-5 mb-4">
          <p className="font-display text-[20px] text-white">OPAC</p>
          <p className="font-body text-[12px] text-[rgba(255,255,255,0.5)] mt-0.5">Admin Panel</p>
        </div>
        {navContent}
      </div>

      {/* ── Mobile: top bar + overlay drawer ─────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 min-w-0">
        {/* Top bar */}
        <div className="h-14 bg-opac-green-dark flex items-center justify-between px-4 flex-shrink-0">
          <p className="font-display text-[20px] text-white">OPAC Admin</p>
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center text-white"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Overlay */}
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Slide-in drawer */}
        <div className={`fixed top-0 left-0 h-full w-[240px] bg-opac-green-dark z-50 flex flex-col py-6 transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between px-5 mb-4">
            <div>
              <p className="font-display text-[20px] text-white">OPAC</p>
              <p className="font-body text-[12px] text-[rgba(255,255,255,0.5)] mt-0.5">Admin Panel</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white">
              <X size={20} />
            </button>
          </div>
          {navContent}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-opac-bg">{children}</main>
      </div>

      {/* ── Desktop main content ──────────────────────────────────── */}
      <main className="hidden md:block flex-1 overflow-y-auto bg-opac-bg">{children}</main>
    </div>
  )
}
