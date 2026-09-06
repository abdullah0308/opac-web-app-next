import type { Metadata } from 'next'
import { Ambient } from '@/components/ui/opac/Ambient'

export const metadata: Metadata = {
  title: 'Offline — OPAC',
}

export default function OfflinePage() {
  return (
    <>
    <Ambient />
    <div className="phone-frame flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 glass-green rounded-[20px] flex items-center justify-center mb-6">
        <span className="text-white font-display text-[28px]">O</span>
      </div>

      <h1 className="font-display text-[22px] text-opac-ink mb-3">You&rsquo;re offline</h1>

      <p className="font-body text-[14px] text-opac-ink-60 leading-relaxed max-w-[280px]">
        OPAC needs a connection to load this page. Check your signal or Wi-Fi, then try again.
      </p>

      <a
        href="/dashboard"
        className="mt-8 px-6 py-3.5 glass-green rounded-[15px] text-white transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.985] font-body font-semibold text-[15px] no-underline"
      >
        Try again
      </a>
    </div>
    </>
  )
}
