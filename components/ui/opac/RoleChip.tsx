type RoleVariant = 'archer' | 'coach' | 'admin';

interface RoleChipProps {
  role?: RoleVariant;
  className?: string;
}

const roleConfig: Record<RoleVariant, { className: string; label: string }> = {
  archer: { className: 'bg-opac-green-light text-[#1A5233]', label: 'Archer' },
  coach:  { className: 'bg-[#FEF3C7] text-[#92400E]',        label: 'Coach' },
  admin:  { className: 'bg-[#EDE9FE] text-[#5B21B6]',        label: 'Admin' },
};

export function RoleChip({ role = 'archer', className = '' }: RoleChipProps) {
  const config = roleConfig[role];
  return (
    <div
      className={`inline-flex items-center h-[26px] px-3 rounded-full ${config.className} ${className}`}
    >
      <span className="font-body text-[13px] font-medium leading-none">
        {config.label}
      </span>
    </div>
  );
}
