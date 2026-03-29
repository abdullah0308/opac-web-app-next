import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { ArcherBottomNav } from '@/components/ui/opac'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'
import { SWRegister } from '@/components/ui/opac/SWRegister'

export default async function ArcherLayout({ children }: { children: ReactNode }) {
  await requireRole('archer')

  return (
    <div className="phone-frame flex flex-col">
      <RoleSync />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ArcherBottomNav />
      <PWAInstallPrompt />
      <SWRegister />
    </div>
  )
}
