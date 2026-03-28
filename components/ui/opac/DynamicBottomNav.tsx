'use client'

import { useRole } from '@/contexts/RoleContext'
import { ArcherBottomNav, CoachBottomNav } from './BottomNavBar'

export function DynamicBottomNav() {
  const { activeRole } = useRole()
  if (activeRole === 'coach') return <CoachBottomNav />
  return <ArcherBottomNav />
}
