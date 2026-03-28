type StatusVariant = 'paid' | 'present' | 'due' | 'warning' | 'overdue' | 'absent';

interface StatusBadgeProps {
  variant?: StatusVariant;
  label?: string;
  className?: string;
}

const variantStyles: Record<StatusVariant, { className: string; defaultLabel: string }> = {
  paid:    { className: 'bg-[#DCFCE7] text-[#16A34A]', defaultLabel: 'PAID' },
  present: { className: 'bg-[#DCFCE7] text-[#16A34A]', defaultLabel: 'PRESENT' },
  due:     { className: 'bg-[#FEF3C7] text-[#D97706]', defaultLabel: 'DUE' },
  warning: { className: 'bg-[#FEF3C7] text-[#D97706]', defaultLabel: 'WARNING' },
  overdue: { className: 'bg-[#FEE2E2] text-[#DC2626]', defaultLabel: 'OVERDUE' },
  absent:  { className: 'bg-[#FEE2E2] text-[#DC2626]', defaultLabel: 'ABSENT' },
};

export function StatusBadge({ variant = 'paid', label, className = '' }: StatusBadgeProps) {
  const style = variantStyles[variant];
  return (
    <div
      className={`inline-flex items-center h-6 px-2.5 rounded-full ${style.className} ${className}`}
    >
      <span className="font-body text-[11px] font-bold leading-none tracking-[0.04em]">
        {label ?? style.defaultLabel}
      </span>
    </div>
  );
}
