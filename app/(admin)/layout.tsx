import type { ReactNode } from 'react'
import { requireRole } from '@/lib/auth'
import { RoleSync } from '@/components/ui/opac/RoleSync'
import { PWAInstallPrompt } from '@/components/ui/opac/PWAInstallPrompt'
import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole('admin')

  return (
    <>
      <RoleSync />
      <AdminLayoutClient>{children}</AdminLayoutClient>
      <PWAInstallPrompt />
    </>
  )
}
