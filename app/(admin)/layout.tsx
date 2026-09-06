import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { Ambient } from '@/components/ui/opac/Ambient'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole('admin')

  return (
    <>
      <Ambient />
      <RoleSync />
      <AdminLayoutClient>{children}</AdminLayoutClient>
      <PWAInstallPrompt />
    </>
  )
}
