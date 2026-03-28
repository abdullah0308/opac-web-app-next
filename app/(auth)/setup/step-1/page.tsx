'use client'

import dynamic from 'next/dynamic'

// ssr: false — uses Clerk's useUser which requires the browser ClerkProvider
const SetupStep1Client = dynamic(() => import('./SetupStep1Client'), { ssr: false })

export default function SetupStep1Page() {
  return <SetupStep1Client />
}
