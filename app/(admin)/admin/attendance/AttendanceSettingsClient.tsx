'use client'

import { useState } from 'react'

export default function AttendanceSettingsClient({ faceEnabled: initial }: { faceEnabled: boolean }) {
  const [faceEnabled, setFaceEnabled] = useState(initial)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    const next = !faceEnabled
    setFaceEnabled(next)
    setSaving(true)
    try {
      await fetch('/api/payload/globals/global-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faceRecognitionEnabled: next }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-[16px] p-5 border border-opac-border">
      <p className="font-body text-[11px] font-semibold text-opac-ink-30 uppercase tracking-[0.08em] mb-4">
        System Settings
      </p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body text-[14px] font-semibold text-opac-ink">Face ID Attendance</p>
          <p className="font-body text-[13px] text-opac-ink-60 mt-0.5">Allow archers to check in via face scan</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${
            faceEnabled ? 'bg-opac-green' : 'bg-opac-border'
          } disabled:opacity-60`}
          aria-label={`${faceEnabled ? 'Disable' : 'Enable'} face ID attendance`}
        >
          <span className={`absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full shadow transition-all duration-200 ${
            faceEnabled ? 'left-[22px]' : 'left-[3px]'
          }`} />
        </button>
      </div>
    </div>
  )
}
