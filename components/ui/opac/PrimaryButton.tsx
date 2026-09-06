'use client';

import { type ReactNode } from 'react';

type PrimaryButtonVariant = 'default' | 'hover' | 'disabled' | 'loading';

interface PrimaryButtonProps {
  label?: string;
  variant?: PrimaryButtonVariant;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
}

function Spinner() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="animate-spin"
    >
      <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
      <path d="M10 2a8 8 0 0 1 8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PrimaryButton({
  label = 'Join Session',
  variant = 'default',
  onClick,
  className = '',
  type = 'button',
  children,
}: PrimaryButtonProps) {
  const isDisabled = variant === 'disabled';
  const isLoading = variant === 'loading';
  const inert = isDisabled || isLoading;

  return (
    <button
      type={type}
      disabled={inert}
      onClick={onClick}
      className={[
        'group relative w-full h-[52px] rounded-[14px] overflow-hidden',
        'font-body text-[15px] font-semibold tracking-[0.01em] text-white',
        'flex items-center justify-center gap-2 outline-none',
        'transition-[transform,box-shadow,filter] duration-[280ms] ease-glide',
        inert
          ? 'bg-opac-ink-30 cursor-not-allowed opacity-70 shadow-none'
          : 'glass-green cursor-pointer shadow-card hover:shadow-card-lg hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985] active:duration-100 sheen',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative z-[1] flex items-center gap-2">
        {isLoading && <Spinner />}
        {children ?? (isLoading ? 'Loading…' : label)}
      </span>
    </button>
  );
}
