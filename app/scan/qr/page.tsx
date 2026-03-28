'use client'

import dynamic from 'next/dynamic'

const QRScannerClient = dynamic(() => import('./QRScannerClient'), { ssr: false })

export default function QRScanPage() {
  return <QRScannerClient />
}
