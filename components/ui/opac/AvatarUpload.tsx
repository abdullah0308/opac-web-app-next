'use client'

import { useRef, useState } from 'react'

export function AvatarUpload({ currentUrl, name }: { currentUrl?: string; name: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        setUploadError(data?.error ?? 'Upload failed')
        setPreview(null)
      }
    } finally {
      setUploading(false)
    }
  }

  const url = preview ?? currentUrl

  return (
    <div className="relative inline-block">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-20 h-20 rounded-full object-cover" />
      ) : (
        <div className="w-20 h-20 rounded-full bg-opac-green-light flex items-center justify-center">
          <span className="font-display text-[28px] text-opac-green">{initials}</span>
        </div>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-opac-green border-2 border-white flex items-center justify-center shadow"
      >
        {uploading ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2V10M2 6H10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {uploadError && (
        <p className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap font-body text-[11px] text-red-500">{uploadError}</p>
      )}
    </div>
  )
}
