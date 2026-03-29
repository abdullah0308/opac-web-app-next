import dynamic from 'next/dynamic'
import { getUserRoles } from '@/lib/auth'
import { redirect } from 'next/navigation'

const QRScannerClient = dynamic(() => import('./QRScannerClient'), { ssr: false })

export default async function QRScanPage() {
  const roles = await getUserRoles()
  if (!roles.includes('coach') && !roles.includes('admin')) {
    redirect('/dashboard')
  }
  return <QRScannerClient />
}
