'use client';

import { useState, type ReactNode } from 'react';

type SecondaryButtonVariant = 'default' | 'hover' | 'disabled';

interface SecondaryButtonProps {
  label?: string;
  variant?: SecondaryButtonVariant;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
}

export function SecondaryButton({
  label = 'View Details',
  variant = 'default',
  onClick,
  className = '',
  type = 'button',
  children,
}: SecondaryButtonProps) {
  const [hovered, setHovered] = useState(false);

  const isDisabled = variant === 'disabled';
  const isHovered = variant === 'hover' || (variant === 'default' && hovered);

  const colorClass = isDisabled
    ? 'border-opac-ink-30 text-opac-ink-30 cursor-not-allowed'
    : `border-opac-green text-opac-green cursor-pointer ${isHovered ? 'bg-opac-green-light' : 'bg-transparent hover:bg-opac-green-light'}`;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full h-[52px] rounded-[12px] border-[1.5px] ${colorClass} font-body text-[15px] font-semibold flex items-center justify-center transition-colors duration-[180ms] outline-none tracking-[0.01em] ${className}`}
    >
      {children ?? label}
    </button>
  );
}
