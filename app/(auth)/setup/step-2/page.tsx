'use client'

import dynamic from 'next/dynamic'

const SetupStep2Client = dynamic(() => import('./SetupStep2Client'), { ssr: false })

export default function SetupStep2Page() {
  return <SetupStep2Client />
}
