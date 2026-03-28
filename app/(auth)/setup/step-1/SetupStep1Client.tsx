'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput } from '@/components/ui/opac'

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

export default function SetupStep1Client() {
  const router = useRouter()
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob]     = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Full name is required.'); return }
    sessionStorage.setItem('opac_setup_step1', JSON.stringify({ name, phone, dob }))
    router.push('/setup/step-2')
  }

  return (
    <div className="flex flex-col px-6 py-6">
      <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] text-center mb-3">
        Step 1 of 2
      </p>
      <ProgressDots step={1} total={2} />

      <div className="mt-8 mb-7">
        <h1 className="font-display text-[28px] text-opac-ink leading-tight mb-2">Welcome to OPAC 🏹</h1>
        <p className="font-body text-[14px] text-opac-ink-60">Let's set up your profile</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          id="name"
          label="Full name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="font-body text-[13px] font-semibold text-opac-ink">
            Phone number
          </label>
          <div className="flex h-[52px] rounded-[8px] border border-opac-border bg-opac-bg overflow-hidden">
            <div className="flex items-center gap-1.5 px-3.5 border-r border-opac-border flex-shrink-0">
              <span className="text-[20px] leading-none">🇲🇺</span>
              <span className="font-body text-[14px] font-semibold text-opac-ink">+230</span>
            </div>
            <input
              id="phone"
              type="tel"
              placeholder="5 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 h-full border-none bg-transparent px-4 font-body text-[15px] text-opac-ink outline-none placeholder:text-opac-ink-30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dob" className="font-body text-[13px] font-semibold text-opac-ink">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="h-[52px] rounded-[8px] border border-opac-border bg-opac-bg px-4 font-body text-[15px] text-opac-ink outline-none"
          />
        </div>

        {error && <p className="font-body text-[13px] text-opac-error">{error}</p>}

        <button
          type="submit"
          className="mt-4 w-full h-[52px] rounded-[12px] bg-opac-green hover:bg-[#1A5233] text-white font-body text-[15px] font-semibold transition-colors duration-150"
        >
          Continue →
        </button>
      </form>
    </div>
  )
}
