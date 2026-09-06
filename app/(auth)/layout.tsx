import type { ReactNode } from 'react'
import { Ambient } from '@/components/ui/opac/Ambient'

/**
 * Auth layout — a single frosted sheet floating on the ambient aurora.
 * Used by: /login, /forgot-password, /setup/step-1, /setup/step-2
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Ambient />
      <div className="min-h-dvh flex items-end sm:items-center justify-center sm:p-8">
        <div className="glass w-full max-w-mobile rounded-t-[34px] sm:rounded-[34px] shadow-card-lg min-h-[70vh] sm:min-h-0 overflow-hidden animate-rise">
          {children}
        </div>
      </div>
    </>
  )
}
