'use client';

import { useState, type ReactNode } from 'react';

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
  const [hovered, setHovered] = useState(false);

  const isDisabled = variant === 'disabled';
  const isLoading = variant === 'loading';
  const isHovered = variant === 'hover' || (variant === 'default' && hovered);

  const bgClass = isDisabled
    ? 'bg-opac-ink-30 cursor-not-allowed'
    : isHovered
    ? 'bg-[#1A5233] cursor-pointer'
    : 'bg-opac-green cursor-pointer hover:bg-[#1A5233]';

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full h-[52px] rounded-[12px] ${bgClass} text-white font-body text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors duration-[180ms] outline-none tracking-[0.01em] ${className}`}
    >
      {isLoading && <Spinner />}
      {children ?? (isLoading ? 'Loading…' : label)}
    </button>
  );
}
