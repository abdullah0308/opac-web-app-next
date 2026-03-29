'use client'

type Props = { archerId: string }

export function QRImage({ archerId }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={`/images/qr-${archerId.toLowerCase()}.png`}
        alt="Your QR code"
        width={64}
        height={64}
        className="rounded-[8px] border border-opac-border"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/qr-default.png'
        }}
      />
      <span className="font-body text-[10px] text-opac-ink-30">Show to check in</span>
    </div>
  )
}
