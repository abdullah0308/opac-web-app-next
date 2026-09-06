'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  BarChart2,
  Users,
  CreditCard,
  Shield,
  CalendarCheck,
  MessageSquare,
  Mail,
  Menu,
  X,
  ArrowLeft,
  Route,
  Trophy,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin/dashboard',  label: 'Dashboard',  Icon: BarChart2     },
  { href: '/admin/users',      label: 'Members',     Icon: Users         },
  { href: '/admin/points',     label: 'Points',      Icon: Trophy        },
  { href: '/admin/payments',   label: 'Payments',    Icon: CreditCard    },
  { href: '/admin/clans',      label: 'Clans',       Icon: Shield        },
  { href: '/admin/pathways',   label: 'Pathways',    Icon: Route         },
  { href: '/admin/attendance', label: 'Attendance',  Icon: CalendarCheck },
  { href: '/admin/forum',      label: 'Forum',       Icon: MessageSquare },
  { href: '/admin/messages',   label: 'Messages',    Icon: Mail          },
]

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navContent = (group: string) => (
    <LayoutGroup id={group}>
      <nav className="flex flex-col gap-1 px-3 mt-2 flex-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition-colors duration-200 ${
                active
                  ? 'text-white'
                  : 'text-[rgba(255,255,255,0.62)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`admin-nav-${group}`}
                  className="absolute inset-0 rounded-[12px] bg-[rgba(255,255,255,0.16)] border border-[rgba(255,255,255,0.14)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                  transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                />
              )}
              <Icon size={18} strokeWidth={1.8} className="relative z-[1]" />
              <span className="relative z-[1] font-body text-[14px] font-semibold">{label}</span>
            </Link>
          )
        })}

        <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.12)] flex flex-col gap-1">
          <Link href="/dashboard" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors duration-200">
            <ArrowLeft size={16} strokeWidth={1.8} />
            <span className="font-body text-[13px]">Archer view</span>
          </Link>
          <Link href="/coach/dashboard" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[rgba(255,255,255,0.55)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors duration-200">
            <ArrowLeft size={16} strokeWidth={1.8} />
            <span className="font-body text-[13px]">Coach view</span>
          </Link>
        </div>
      </nav>
    </LayoutGroup>
  )

  return (
    <div className="desk-frame flex h-full">
      {/* ── Desktop sidebar (md+) ─────────────────────────────────── */}
      <aside className="glass-dark hidden md:flex w-[228px] flex-shrink-0 flex-col py-6 h-full border-y-0 border-l-0">
        <div className="px-5 mb-4">
          <p className="font-display text-[21px] text-white">OPAC</p>
          <p className="font-body text-[12px] text-[rgba(255,255,255,0.5)] mt-0.5">Admin Panel</p>
        </div>
        {navContent('desktop')}
      </aside>

      {/* ── Mobile: top bar + overlay drawer ─────────────────────── */}
      <div className="flex md:hidden flex-col flex-1 min-w-0">
        <div className="glass-dark h-14 flex items-center justify-between px-4 flex-shrink-0 border-x-0 border-t-0">
          <p className="font-display text-[20px] text-white">OPAC Admin</p>
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 flex items-center justify-center text-white rounded-[10px] transition-transform duration-200 ease-glide active:scale-90"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-[rgba(15,51,32,0.32)] backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="glass-dark fixed top-0 left-0 h-full w-[252px] z-50 flex flex-col py-6 border-y-0 border-l-0 shadow-card-lg"
            >
              <div className="flex items-center justify-between px-5 mb-4">
                <div>
                  <p className="font-display text-[21px] text-white">OPAC</p>
                  <p className="font-body text-[12px] text-[rgba(255,255,255,0.5)] mt-0.5">Admin Panel</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-white active:scale-90 transition-transform" aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              {navContent('mobile')}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ── Desktop main content ──────────────────────────────────── */}
      <main className="hidden md:block flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
