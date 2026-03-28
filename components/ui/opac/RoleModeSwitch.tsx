'use client';

import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';

export type ActiveRole = 'archer' | 'coach';

const SEGMENTS: { id: ActiveRole; emoji: string; label: string }[] = [
  { id: 'archer', emoji: '🏹', label: 'Archer' },
  { id: 'coach',  emoji: '🎯', label: 'Coach'  },
];

const roleRoutes: Record<ActiveRole, string> = {
  archer: '/dashboard',
  coach: '/coach/dashboard',
};

interface RoleModeSwitchProps {
  compact?: boolean;
  className?: string;
}

export function RoleModeSwitch({ compact = false, className = '' }: RoleModeSwitchProps) {
  const { activeRole, setActiveRole } = useRole();
  const router = useRouter();

  const handleChange = (role: ActiveRole) => {
    setActiveRole(role);
    router.push(roleRoutes[role]);
  };

  return (
    <div
      className={`inline-flex items-center bg-white border border-opac-border rounded-full p-1 h-9 gap-0.5 flex-shrink-0 ${className}`}
    >
      {SEGMENTS.map(({ id, emoji, label }) => {
        const active = activeRole === id;
        return (
          <button
            key={id}
            onClick={() => handleChange(id)}
            className={`inline-flex items-center justify-center h-7 rounded-full font-body text-[13px] font-semibold gap-1.5 whitespace-nowrap transition-colors duration-150 ${
              compact ? 'px-2.5' : 'px-3.5'
            } ${
              active
                ? 'bg-opac-green text-white'
                : 'bg-transparent text-opac-ink-60 hover:bg-opac-surface'
            }`}
          >
            <span className="text-[13px] leading-none">{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
