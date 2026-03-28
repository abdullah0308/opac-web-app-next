import Link from 'next/link'

export const metadata = { title: 'Forgot Password — OPAC' }

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col px-6 py-8">
      {/* Back */}
      <Link
        href="/login"
        className="flex items-center gap-1.5 font-body text-[14px] text-opac-ink-60 mb-8 w-fit"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to login
      </Link>

      <h1 className="font-display text-[28px] text-opac-ink leading-tight mb-2">
        Reset password
      </h1>
      <p className="font-body text-[14px] text-opac-ink-60 mb-8">
        Enter your email and we'll send you a reset link.
      </p>

      {/* Clerk handles password reset via its hosted flow */}
      <p className="font-body text-[14px] text-opac-ink-60 text-center mt-4">
        Use the{' '}
        <Link href="/login" className="text-opac-green font-semibold underline-offset-2 underline">
          sign in page
        </Link>{' '}
        and click "Forgot password?" to trigger the reset email.
      </p>
    </div>
  )
}
