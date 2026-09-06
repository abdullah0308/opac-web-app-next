import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { getViewContext } from '@/lib/viewer'
import { ArcherBottomNav } from '@/components/ui/opac'
import { Ambient } from '@/components/ui/opac/Ambient'
import { PageTransition } from '@/components/ui/opac/PageTransition'
import { WardSwitcher } from '@/components/ui/opac/WardSwitcher'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'

export default async function ArcherLayout({ children }: { children: ReactNode }) {
  await requireRole('archer')
  const ctx = await getViewContext()

  return (
    <>
      <Ambient />
      <div className="phone-frame flex flex-col">
        <RoleSync />
        <main className="flex-1 overflow-y-auto pb-dock">
          {ctx && ctx.wards.length > 0 && (
            <WardSwitcher
              wards={ctx.wards.map((w) => ({
                id: w.id,
                name: w.name,
                archerId: w.archerId,
                avatarUrl: w.avatarUrl,
              }))}
              subjectId={ctx.subjectId}
              viewerId={ctx.viewerId}
              viewerName={ctx.viewer.name}
              isProxy={ctx.isProxy}
            />
          )}
          <PageTransition>{children}</PageTransition>
        </main>
        <ArcherBottomNav />
        <PWAInstallPrompt />
      </div>
    </>
  )
}
