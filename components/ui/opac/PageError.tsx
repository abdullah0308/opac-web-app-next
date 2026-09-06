'use client'

interface PageErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function PageError({ error, reset }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center gap-5 anim-rise">
      <div className="w-16 h-16 rounded-full bg-[rgba(254,226,226,0.6)] border border-[rgba(239,68,68,0.18)] backdrop-blur-[8px] flex items-center justify-center anim-scale-in">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 8V15" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="14" cy="20" r="1.5" fill="#EF4444" />
          <path d="M12.3 3.5L2.5 20.5C1.7 22 2.8 23.5 4.5 23.5H23.5C25.2 23.5 26.3 22 25.5 20.5L15.7 3.5C14.9 2 13.1 2 12.3 3.5Z" stroke="#EF4444" strokeWidth="2" fill="none" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <h2 className="font-display text-[18px] text-[#1A2B1A] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#5A7A5A]">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
      <button
        onClick={reset}
        className="glass-green sheen relative overflow-hidden px-6 py-3 rounded-[14px] text-white text-sm font-semibold cursor-pointer transition-transform duration-300 ease-glide hover:-translate-y-[2px] active:scale-[0.985]"
      >
        Try again
      </button>
    </div>
  )
}
