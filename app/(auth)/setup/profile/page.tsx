import { Suspense } from 'react'
import ProfileSetupClient from './ProfileSetupClient'

export const metadata = { title: 'Complete Your Profile — OPAC' }

export default function ProfileSetupPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-full border-2 border-opac-green border-t-transparent animate-spin" /></div>}>
      <ProfileSetupClient />
    </Suspense>
  )
}
