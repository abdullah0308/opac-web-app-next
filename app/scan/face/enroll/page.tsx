'use client'

import dynamic from 'next/dynamic'

const FaceEnrollClient = dynamic(() => import('./FaceEnrollClient'), { ssr: false })

export default function FaceEnrollPage() {
  return <FaceEnrollClient />
}
