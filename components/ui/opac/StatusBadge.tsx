type StatusVariant = 'paid' | 'present' | 'due' | 'warning' | 'overdue' | 'absent';

interface StatusBadgeProps {
  variant?: StatusVariant;
  label?: string;
  className?: string;
  /** Adds a pulsing halo — use for live states like "present today". */
  live?: boolean;
}

const variantStyles: Record<
  StatusVariant,
  { className: string; dot: string; defaultLabel: string }
> = {
  paid: {
    className: 'bg-[rgba(220,252,231,0.72)] text-[#16803C] border-[rgba(22,163,74,0.22)]',
    dot: 'bg-[#16A34A]',
    defaultLabel: 'PAID',
  },
  present: {
    className: 'bg-[rgba(220,252,231,0.72)] text-[#16803C] border-[rgba(22,163,74,0.22)]',
    dot: 'bg-[#16A34A]',
    defaultLabel: 'PRESENT',
  },
  due: {
    className: 'bg-[rgba(254,243,199,0.72)] text-[#B45309] border-[rgba(217,119,6,0.22)]',
    dot: 'bg-[#D97706]',
    defaultLabel: 'DUE',
  },
  warning: {
    className: 'bg-[rgba(254,243,199,0.72)] text-[#B45309] border-[rgba(217,119,6,0.22)]',
    dot: 'bg-[#D97706]',
    defaultLabel: 'WARNING',
  },
  overdue: {
    className: 'bg-[rgba(254,226,226,0.72)] text-[#B91C1C] border-[rgba(220,38,38,0.22)]',
    dot: 'bg-[#DC2626]',
    defaultLabel: 'OVERDUE',
  },
  absent: {
    className: 'bg-[rgba(254,226,226,0.72)] text-[#B91C1C] border-[rgba(220,38,38,0.22)]',
    dot: 'bg-[#DC2626]',
    defaultLabel: 'ABSENT',
  },
};

export function StatusBadge({
  variant = 'paid',
  label,
  className = '',
  live = false,
}: StatusBadgeProps) {
  const style = variantStyles[variant];
  return (
    <div
      className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full border backdrop-blur-[8px] ${style.className} ${className}`}
    >
      {live && (
        <span className="relative flex w-1.5 h-1.5 flex-shrink-0">
          <span className={`absolute inset-0 rounded-full ${style.dot} animate-pulse-ring`} />
          <span className={`relative w-1.5 h-1.5 rounded-full ${style.dot}`} />
        </span>
      )}
      <span className="font-body text-[11px] font-bold leading-none tracking-[0.05em]">
        {label ?? style.defaultLabel}
      </span>
    </div>
  );
}
