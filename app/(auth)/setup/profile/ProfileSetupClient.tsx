'use client'

import { useState, useRef } from 'react'

type Step = 'avatar' | 'faceid'

export default function ProfileSetupClient() {
  const [step, setStep] = useState<Step>('avatar')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Avatar step ─────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      // Skip avatar — go straight to face ID step
      setStep('faceid')
      return
    }
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
    } catch {
      // Upload failed — non-blocking, user can update photo from profile later
    } finally {
      setUploading(false)
      setStep('faceid')
    }
  }

  // ── Face ID step ─────────────────────────────────────────────────────────────

  const handleNoFaceId = async () => {
    setCompleting(true)
    setError('')
    try {
      // Mark setup as complete via Payload REST API
      const res = await fetch('/api/complete-setup', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to complete setup')
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
      setCompleting(false)
    }
  }

  const handleYesFaceId = () => {
    window.location.href = '/scan/face/enroll'
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center px-5 py-10 min-h-screen justify-center bg-opac-bg">
      {/* Progress indicator */}
      <div className="flex gap-2 mb-8">
        <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 'avatar' ? 'bg-opac-green' : 'bg-opac-green'}`} />
        <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 'faceid' ? 'bg-opac-green' : 'bg-opac-border'}`} />
      </div>

      {step === 'avatar' && (
        <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-card flex flex-col items-center gap-5">
          <div className="text-center">
            <h2 className="font-display text-[22px] text-opac-ink mb-1">Add a profile photo</h2>
            <p className="font-body text-[13px] text-opac-ink-60">Help your teammates recognise you</p>
          </div>

          {/* Avatar preview */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-24 h-24 rounded-full bg-opac-green-light border-2 border-dashed border-opac-green flex items-center justify-center overflow-hidden"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="12" r="5" stroke="#2E7D4F" strokeWidth="2"/>
                <path d="M6 28C6 22.477 10.477 18 16 18C21.523 18 26 22.477 26 28" stroke="#2E7D4F" strokeWidth="2" strokeLinecap="round"/>
                <path d="M24 6V12M21 9H27" stroke="#2E7D4F" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {avatarPreview && (
            <p className="font-body text-[12px] text-opac-green text-center">Photo selected ✓</p>
          )}

          {error && <p className="font-body text-[13px] text-red-500 text-center">{error}</p>}

          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={handleAvatarUpload}
              disabled={uploading}
              className="w-full h-12 rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : avatarPreview ? 'Upload & Continue' : 'Skip for now'}
            </button>
            {avatarPreview && (
              <button
                type="button"
                onClick={() => setStep('faceid')}
                className="w-full h-10 rounded-[12px] text-opac-ink-60 font-body text-[14px]"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'faceid' && (
        <div className="w-full max-w-[340px] bg-white rounded-2xl p-6 shadow-card flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-opac-green-light flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="#2E7D4F" strokeWidth="2"/>
              <circle cx="11" cy="14" r="1.5" fill="#2E7D4F"/>
              <circle cx="21" cy="14" r="1.5" fill="#2E7D4F"/>
              <path d="M11 20C11 20 12.5 23 16 23C19.5 23 21 20 21 20" stroke="#2E7D4F" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 10C9.5 8.5 11.5 7.5 14 7.5M24 10C22.5 8.5 20.5 7.5 18 7.5" stroke="#2E7D4F" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="text-center">
            <h2 className="font-display text-[22px] text-opac-ink mb-1">Enable Face ID check-in?</h2>
            <p className="font-body text-[13px] text-opac-ink-60 leading-relaxed">
              Scan your face once to enable automatic attendance check-in at the range. You can set this up later from your profile.
            </p>
          </div>

          {error && <p className="font-body text-[13px] text-red-500 text-center">{error}</p>}

          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={handleYesFaceId}
              className="w-full h-12 rounded-[12px] bg-opac-green text-white font-body text-[15px] font-semibold"
            >
              Yes, enrol my face
            </button>
            <button
              type="button"
              onClick={handleNoFaceId}
              disabled={completing}
              className="w-full h-12 rounded-[12px] border border-opac-border text-opac-ink-60 font-body text-[14px] disabled:opacity-60"
            >
              {completing ? 'Setting up…' : 'No thanks, skip'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
