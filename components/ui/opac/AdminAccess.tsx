'use client';

import Link from 'next/link';

interface AdminAccessButtonProps {
  pressed?: boolean;
  className?: string;
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="2.5" stroke="#2E7D4F" strokeWidth="1.5" />
      <path
        d="M9 2V3.5M9 14.5V16M2 9H3.5M14.5 9H16M4.1 4.1L5.2 5.2M12.8 12.8L13.9 13.9M4.1 13.9L5.2 12.8M12.8 5.2L13.9 4.1"
        stroke="#2E7D4F"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AdminAccessButton({ pressed = false, className = '' }: AdminAccessButtonProps) {
  return (
    <Link href="/admin/dashboard">
      <button
        className={`w-9 h-9 rounded-[10px] ${
          pressed ? 'bg-opac-green-light' : 'bg-opac-surface'
        } border border-opac-border flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors duration-150 p-0 ${className}`}
        aria-label="Admin panel"
      >
        <GearIcon />
      </button>
    </Link>
  );
}
