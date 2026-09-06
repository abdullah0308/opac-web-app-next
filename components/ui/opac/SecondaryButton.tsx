'use client';

import { type ReactNode } from 'react';

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
  const isDisabled = variant === 'disabled';

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={[
        'relative w-full h-[52px] rounded-[14px] overflow-hidden',
        'font-body text-[15px] font-semibold tracking-[0.01em]',
        'flex items-center justify-center outline-none',
        'transition-[transform,box-shadow,background-color,color] duration-[280ms] ease-glide',
        isDisabled
          ? 'glass-well text-opac-ink-30 cursor-not-allowed opacity-70'
          : 'glass-card text-opac-green cursor-pointer hover:-translate-y-[2px] hover:shadow-card-lg hover:text-opac-green-dark active:translate-y-0 active:scale-[0.985] active:duration-100 sheen',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="relative z-[1]">{children ?? label}</span>
    </button>
  );
}
