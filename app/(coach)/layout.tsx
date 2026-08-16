import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { CoachBottomNav } from '@/components/ui/opac'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'

export default async function CoachLayout({ children }: { children: ReactNode }) {
  await requireRole('coach')

  return (
    <div className="phone-frame flex flex-col">
      <RoleSync />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <CoachBottomNav />
      <PWAInstallPrompt />
    </div>
  )
}
