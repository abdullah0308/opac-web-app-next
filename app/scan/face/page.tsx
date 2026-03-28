'use client'

import dynamic from 'next/dynamic'

const FaceScannerClient = dynamic(() => import('./FaceScannerClient'), { ssr: false })

export default function FaceScanPage() {
  return <FaceScannerClient />
}
