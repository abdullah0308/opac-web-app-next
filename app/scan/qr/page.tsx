import { getUserRoles } from '@/lib/auth'
import { redirect } from 'next/navigation'
import QRScannerWrapper from './QRScannerWrapper'

export default async function QRScanPage() {
  const roles = await getUserRoles()
  if (!roles.includes('coach') && !roles.includes('admin')) {
    redirect('/dashboard')
  }
  return <QRScannerWrapper />
}
