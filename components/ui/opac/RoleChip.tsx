type RoleVariant = 'archer' | 'coach' | 'admin';

interface RoleChipProps {
  role?: RoleVariant;
  className?: string;
}

const roleConfig: Record<RoleVariant, { className: string; label: string }> = {
  archer: {
    className: 'bg-[rgba(212,234,217,0.7)] text-[#1A5233] border-[rgba(46,125,79,0.22)]',
    label: 'Archer',
  },
  coach: {
    className: 'bg-[rgba(254,243,199,0.7)] text-[#92400E] border-[rgba(212,160,23,0.28)]',
    label: 'Coach',
  },
  admin: {
    className: 'bg-[rgba(237,233,254,0.7)] text-[#5B21B6] border-[rgba(91,33,182,0.2)]',
    label: 'Admin',
  },
};

export function RoleChip({ role = 'archer', className = '' }: RoleChipProps) {
  const config = roleConfig[role];
  return (
    <div
      className={`inline-flex items-center h-[26px] px-3 rounded-full border backdrop-blur-[8px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${config.className} ${className}`}
    >
      <span className="font-body text-[13px] font-medium leading-none">
        {config.label}
      </span>
    </div>
  );
}
