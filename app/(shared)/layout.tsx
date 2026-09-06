import type { ReactNode } from 'react'
import { getCurrentUserId } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Ambient } from '@/components/ui/opac/Ambient'
import { PageTransition } from '@/components/ui/opac/PageTransition'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { DynamicBottomNav } from '@/components/ui/opac/DynamicBottomNav'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'

export default async function SharedLayout({ children }: { children: ReactNode }) {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return (
    <>
      <Ambient />
      <div className="phone-frame flex flex-col">
        <RoleSync />
        <main className="flex-1 overflow-y-auto pb-dock">
          <PageTransition>{children}</PageTransition>
        </main>
        <DynamicBottomNav />
        <PWAInstallPrompt />
      </div>
    </>
  )
}
