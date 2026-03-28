'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { OPACLogoLarge } from '@/components/ui/opac'
import { TextInput } from '@/components/ui/opac'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [archerId, setArcherId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!archerId.trim()) { setError('Please enter your Archer ID.'); return }
    if (!password) { setError('Please enter your password.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archerId: archerId.trim().toUpperCase(), password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Login failed. Please try again.')
        setLoading(false)
        return
      }

      const redirectTo = searchParams.get('redirect_url') ?? '/dashboard'
      // Full page navigation ensures the new cookie is sent with the next request
      window.location.href = redirectTo
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center px-5 py-10 min-h-screen justify-center">
      {/* Logo + title */}
      <div className="flex flex-col items-center mb-10">
        <OPACLogoLarge size={88} />
        <h1 className="font-display text-[28px] text-opac-green-dark text-center leading-tight mt-3 mb-1">
          OPAC
        </h1>
        <p className="font-body text-[14px] text-opac-ink-60 text-center">
          Oasis Pailles Archery Club
        </p>
      </div>

      {/* Login card */}
      <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-card">
        <h2 className="font-display text-[20px] text-opac-ink mb-1">Sign in</h2>
        <p className="text-[13px] text-opac-ink-60 mb-6">Enter your Archer ID and password</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            id="archerId"
            label="Archer ID"
            placeholder="e.g. AM0032"
            value={archerId}
            onChange={(e) => setArcherId(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-body text-[13px] font-semibold text-opac-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="h-[52px] rounded-[8px] border border-opac-border bg-opac-bg px-4 font-body text-[15px] text-opac-ink outline-none focus:border-opac-green transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full h-[52px] rounded-[12px] bg-opac-green hover:bg-[#1A5233] text-white font-body text-[15px] font-semibold transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
