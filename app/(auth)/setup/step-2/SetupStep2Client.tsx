'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput } from '@/components/ui/opac'

type BowType = 'recurve' | 'compound'
type Gender  = 'male' | 'female'

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < step ? 'w-6 bg-opac-green' : i === step ? 'w-6 bg-opac-green-light' : 'w-2 bg-opac-border'
          }`}
        />
      ))}
    </div>
  )
}

function PillToggle<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          className={`flex-1 h-[48px] rounded-[10px] font-body text-[14px] font-semibold border transition-colors duration-150 ${
            value === opt.value
              ? 'bg-opac-green text-white border-opac-green'
              : 'bg-opac-bg text-opac-ink border-opac-border hover:bg-opac-green-light'
          }`}>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function SetupStep2Client() {
  const router = useRouter()

  const [archerId,     setArcherId]     = useState('')
  const [bowType,      setBowType]      = useState<BowType>('recurve')
  const [gender,       setGender]       = useState<Gender>('male')
  const [termsChecked, setTermsChecked] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!archerId.trim()) { setError('Archer ID is required.'); return }
    if (!termsChecked) { setError('Please accept the terms to continue.'); return }

    setLoading(true)
    setError('')

    try {
      const step1 = JSON.parse(sessionStorage.getItem('opac_setup_step1') ?? '{}')

      const res = await fetch('/api/payload/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archerId:    archerId.trim().toUpperCase(),
          name:        step1.name ?? '',
          phone:       step1.phone ?? '',
          dateOfBirth: step1.dob ?? '',
          email:       `${archerId.trim().toLowerCase()}@opac.app`,
          password:    crypto.randomUUID(),
          roles:       ['archer'],
          bowType,
          gender,
          active:      true,
          faceEnrolled: false,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body?.errors?.[0]?.message ?? 'Failed to create profile')
      }

      sessionStorage.removeItem('opac_setup_step1')
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col px-6 py-6">
      <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] text-center mb-3">
        Step 2 of 2
      </p>
      <ProgressDots step={2} total={2} />

      <div className="mt-8 mb-6">
        <h1 className="font-display text-[24px] text-opac-ink leading-tight">
          Tell us about your archery
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextInput
          id="archerId"
          label="Archer ID"
          placeholder="e.g. AM0032"
          value={archerId}
          onChange={(e) => setArcherId(e.target.value)}
        />

        <div>
          <p className="font-body text-[13px] font-semibold text-opac-ink mb-2.5">Bow type</p>
          <PillToggle options={[{ value: 'recurve', label: '🏹 Recurve' }, { value: 'compound', label: 'Compound' }]} value={bowType} onChange={setBowType} />
        </div>

        <div>
          <p className="font-body text-[13px] font-semibold text-opac-ink mb-2.5">Gender</p>
          <PillToggle options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} value={gender} onChange={setGender} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-opac-green flex-shrink-0" />
          <span className="font-body text-[13px] text-opac-ink-60">
            I agree to the OPAC club rules and code of conduct.
          </span>
        </label>

        {error && <p className="font-body text-[13px] text-opac-error">{error}</p>}

        <button type="submit" disabled={loading || !termsChecked}
          className="w-full h-[52px] rounded-[12px] bg-opac-green hover:bg-[#1A5233] text-white font-body text-[15px] font-semibold transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? 'Setting up your profile…' : 'Complete Setup 🏹'}
        </button>
      </form>
    </div>
  )
}
