import Link from 'next/link'
import { type ReactNode } from 'react'

interface ScreenHeaderProps {
  title?: string
  right?: ReactNode
  /** @deprecated use `right` instead */
  rightIcon?: ReactNode
  leftIcon?: ReactNode
  showBack?: boolean
  backHref?: string
  subtitle?: string
  className?: string
}

export function ScreenHeader({
  title = 'Dashboard',
  right,
  rightIcon,
  leftIcon,
  showBack = false,
  backHref = '/',
  subtitle,
  className = '',
}: ScreenHeaderProps) {
  const rightSlot = right ?? rightIcon ?? (
    <Link href="/profile" className="w-9 h-9 rounded-full bg-opac-surface flex items-center justify-center" aria-label="Profile">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="8" r="3.5" stroke="#5C5C58" strokeWidth="1.5"/>
        <path d="M3 18C3 14.7 6.1 12 10 12S17 14.7 17 18" stroke="#5C5C58" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </Link>
  )

  return (
    <div className={`bg-white border-b border-opac-border shadow-[0_1px_8px_rgba(0,0,0,0.05)] ${className}`}>
      <div className={`flex items-center px-5 ${subtitle ? 'py-2.5' : 'h-14'}`}>
        {showBack ? (
          <Link href={backHref}
            className="w-9 h-9 rounded-[10px] bg-opac-surface flex items-center justify-center flex-shrink-0 mr-2.5"
            aria-label="Go back">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="#1A1A18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        ) : (
          <div className="w-8 flex-shrink-0">{leftIcon}</div>
        )}
        <div className="flex-1 min-w-0">
          <span className={`font-display text-opac-ink leading-tight ${showBack ? 'text-[18px]' : 'text-[22px]'}`}>
            {title}
          </span>
          {subtitle && (
            <p className="font-body text-[12px] text-opac-ink-60 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0">{rightSlot}</div>
      </div>
    </div>
  )
}
