'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { colors } from './tokens';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9 21 9 15 12 15C15 15 15 21 15 21M9 21H15" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const TargetIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" />
    <circle cx="12" cy="12" r="1.5" fill={active ? colors.primaryGreen : colors.inkDisabled} />
    <path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="3" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" />
    <path d="M3 10H21M8 3V7M16 3V7" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 14H7.01M12 14H12.01M17 14H17.01M7 17H7.01M12 17H12.01" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20 2H4C2.895 2 2 2.895 2 4V16C2 17.105 2.895 18 4 18H7L10.5 22L14 18H20C21.105 18 22 17.105 22 16V4C22 2.895 21.105 2 20 2Z" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M7 9H17M7 13H13" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" />
    <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const ChartIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="14" width="4" height="7" rx="1" fill={active ? colors.primaryGreen : colors.inkDisabled} />
    <rect x="10" y="9" width="4" height="12" rx="1" fill={active ? colors.primaryGreen : colors.inkDisabled} />
    <rect x="17" y="4" width="4" height="17" rx="1" fill={active ? colors.primaryGreen : colors.inkDisabled} />
  </svg>
);
const BowIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 12C4 7.58 7.58 4 12 4" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 12C4 16.42 7.58 20 12 20" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 4L20 12L12 20" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="12" x2="18" y2="12" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 2" />
  </svg>
);
const WalletIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="6" width="20" height="14" rx="3" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" />
    <path d="M16 13C16 13.5523 16.4477 14 17 14C17.5523 14 18 13.5523 18 13C18 12.4477 17.5523 12 17 12C16.4477 12 16 12.4477 16 13Z" fill={active ? colors.primaryGreen : colors.inkDisabled} />
    <path d="M2 10H22M6 6V4" stroke={active ? colors.primaryGreen : colors.inkDisabled} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ─── Route definitions ────────────────────────────────────────────────────────

const archerNav = [
  { label: 'HOME',     href: '/dashboard',     icon: HomeIcon },
  { label: 'SCORES',   href: '/scores',         icon: TargetIcon },
  { label: 'ATTEND',   href: '/attendance',     icon: CalendarIcon },
  { label: 'FORUM',    href: '/forum',          icon: ChatIcon },
  { label: 'PROFILE',  href: '/profile',        icon: UserIcon },
];

const coachNav = [
  { label: 'DASH',     href: '/coach/dashboard',  icon: ChartIcon },
  { label: 'ARCHERS',  href: '/coach/archers',    icon: BowIcon },
  { label: 'ATTEND',   href: '/coach/attendance', icon: CalendarIcon },
  { label: 'FORUM',    href: '/forum',            icon: ChatIcon },
  { label: 'PROFILE',  href: '/profile',          icon: UserIcon },
];

// ─── Shared NavItem ───────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: ({ active }: { active: boolean }) => React.ReactElement;
  active: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 min-w-[44px]">
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-150 ${
          active ? 'bg-[#F0F7F2]' : 'bg-transparent'
        }`}
      >
        <Icon active={active} />
      </div>
      <span
        className={`font-body text-[10px] font-semibold tracking-[0.04em] leading-none ${
          active ? 'text-opac-green' : 'text-opac-ink-30'
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

// ─── Exported nav bars ────────────────────────────────────────────────────────

export function ArcherBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="h-[72px] bg-opac-card border-t border-opac-border flex items-center justify-around pb-1">
      {archerNav.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
        />
      ))}
    </nav>
  );
}

export function CoachBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="h-[72px] bg-opac-card border-t border-opac-border flex items-center justify-around pb-1">
      {coachNav.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
        />
      ))}
    </nav>
  );
}
