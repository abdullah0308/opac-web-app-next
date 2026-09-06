import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { CoachBottomNav } from '@/components/ui/opac'
import { Ambient } from '@/components/ui/opac/Ambient'
import { PageTransition } from '@/components/ui/opac/PageTransition'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'

export default async function CoachLayout({ children }: { children: ReactNode }) {
  await requireRole('coach')

  return (
    <>
      <Ambient />
      <div className="phone-frame flex flex-col">
        <RoleSync />
        <main className="flex-1 overflow-y-auto pb-dock">
          <PageTransition>{children}</PageTransition>
        </main>
        <CoachBottomNav />
        <PWAInstallPrompt />
      </div>
    </>
  )
}
