import type { ReactNode } from 'react'

/**
 * Auth layout — centred mobile frame, no bottom nav, gradient background.
 * Used by: /login, /forgot-password, /setup/step-1, /setup/step-2
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-opac-green-light via-[#EAF4EC] to-opac-bg flex items-end sm:items-center justify-center sm:p-8">
      <div className="w-full max-w-mobile bg-white rounded-t-[32px] sm:rounded-[32px] shadow-card-lg min-h-[70vh] sm:min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
