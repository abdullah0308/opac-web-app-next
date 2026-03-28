'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export type ActiveRole = 'archer' | 'coach';
export type UserRole = 'archer' | 'coach' | 'admin';

interface RoleContextValue {
  /** All roles the user holds (synced from Clerk in Step 4) */
  availableRoles: UserRole[];
  setAvailableRoles: (roles: UserRole[]) => void;
  /** The currently active UI role */
  activeRole: ActiveRole;
  setActiveRole: (role: ActiveRole) => void;
  isCoach: boolean;
  isAdmin: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>(['archer']);
  const [activeRole, setActiveRole] = useState<ActiveRole>('archer');

  const isCoach = availableRoles.includes('coach');
  const isAdmin = availableRoles.includes('admin');

  return (
    <RoleContext.Provider
      value={{
        availableRoles,
        setAvailableRoles,
        activeRole,
        setActiveRole,
        isCoach,
        isAdmin,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside <RoleProvider>');
  return ctx;
}
