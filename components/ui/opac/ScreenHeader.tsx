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
    <button className="w-8 h-8 flex items-center justify-center cursor-pointer" aria-label="Notifications">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2C7.23858 2 5 4.23858 5 7V11L3 13V14H17V13L15 11V7C15 4.23858 12.7614 2 10 2Z"
          stroke="#1A1A18" strokeWidth="1.6" strokeLinejoin="round"
        />
        <path d="M8 14C8 15.1046 8.89543 16 10 16C11.1046 16 12 15.1046 12 14" stroke="#1A1A18" strokeWidth="1.6"/>
      </svg>
    </button>
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
