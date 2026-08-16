import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline — OPAC',
}

export default function OfflinePage() {
  return (
    <div className="phone-frame flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-[18px] bg-opac-green flex items-center justify-center mb-6">
        <span className="text-white font-display text-[28px]">O</span>
      </div>

      <h1 className="font-display text-[22px] text-opac-ink mb-3">You&rsquo;re offline</h1>

      <p className="font-body text-[14px] text-opac-ink-60 leading-relaxed max-w-[280px]">
        OPAC needs a connection to load this page. Check your signal or Wi-Fi, then try again.
      </p>

      <a
        href="/dashboard"
        className="mt-8 px-6 py-3.5 rounded-[14px] bg-opac-green text-white font-body font-semibold text-[15px] no-underline"
      >
        Try again
      </a>
    </div>
  )
}
