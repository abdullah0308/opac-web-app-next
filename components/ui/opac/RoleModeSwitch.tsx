'use client';

import { useRouter } from 'next/navigation';
import { motion, LayoutGroup } from 'framer-motion';
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
    <LayoutGroup id="role-switch">
      <div
        className={`glass-well inline-flex items-center rounded-full p-1 h-9 gap-0.5 flex-shrink-0 ${className}`}
        role="tablist"
      >
        {SEGMENTS.map(({ id, emoji, label }) => {
          const active = activeRole === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => handleChange(id)}
              className={`relative inline-flex items-center justify-center h-7 rounded-full font-body text-[13px] font-semibold gap-1.5 whitespace-nowrap transition-colors duration-200 ${
                compact ? 'px-2.5' : 'px-3.5'
              } ${active ? 'text-white' : 'text-opac-ink-60 hover:text-opac-ink'}`}
            >
              {active && (
                <motion.span
                  layoutId="role-switch-thumb"
                  className="glass-green absolute inset-0 rounded-full"
                  transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                />
              )}
              <span className="relative z-[1] text-[13px] leading-none">{emoji}</span>
              <span className="relative z-[1]">{label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
