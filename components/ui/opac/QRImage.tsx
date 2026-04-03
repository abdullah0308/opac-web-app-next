'use client'

import { useEffect, useRef } from 'react'

type Props = { archerId: string }

export function QRImage({ archerId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!archerId || !canvasRef.current) return
    import('qrcode').then((QRCode) => {
      QRCode.toCanvas(canvasRef.current!, archerId, {
        width: 72,
        margin: 1,
        color: { dark: '#1A2B1A', light: '#FFFFFF' },
      })
    })
  }, [archerId])

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        className="rounded-[8px] border border-opac-border"
        style={{ width: 72, height: 72 }}
      />
      <span className="font-body text-[10px] text-opac-ink-30">Show to check in</span>
    </div>
  )
}
