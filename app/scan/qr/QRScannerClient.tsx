'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Html5Qrcode } from 'html5-qrcode'

type ScanState = 'active' | 'processing' | 'success' | 'error'

interface ScanResult {
  sessionName?: string
  archerName?: string
  error?: string
}

const SCANNING_CSS = `
  @keyframes qr-scan {
    0%, 100% { top: 12%; }
    50%       { top: 78%; }
  }
  @keyframes qr-spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes dismiss-bar {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes bracket-glow {
    0%,100% { filter: drop-shadow(0 0 3px rgba(46,125,79,0.6)); }
    50%      { filter: drop-shadow(0 0 8px rgba(46,125,79,1)); }
  }
`

function QRCornerBrackets({ color }: { color: string }) {
  const base: React.CSSProperties = {
    position: 'absolute', width: 32, height: 32, borderStyle: 'solid', borderColor: color,
  }
  return (
    <>
      <div style={{ ...base, top: 0, left: 0, borderWidth: '3px 0 0 3px', borderRadius: '3px 0 0 0' }} />
      <div style={{ ...base, top: 0, right: 0, borderWidth: '3px 3px 0 0', borderRadius: '0 3px 0 0' }} />
      <div style={{ ...base, bottom: 0, left: 0, borderWidth: '0 0 3px 3px', borderRadius: '0 0 0 3px' }} />
      <div style={{ ...base, bottom: 0, right: 0, borderWidth: '0 3px 3px 0', borderRadius: '0 0 3px 0' }} />
    </>
  )
}

export default function QRScannerClient() {
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [state, setState] = useState<ScanState>('active')
  const [result, setResult] = useState<ScanResult>({})
  const [archerId, setArcherId] = useState<string>('')

  // Fetch current user's archer ID on mount
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(d => { if (d.archerId) setArcherId(d.archerId) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const elementId = 'qr-reader'
    const scanner = new Html5Qrcode(elementId)
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        if (state !== 'active') return
        setState('processing')
        scanner.stop().catch(() => {})
        handleQRCode(decodedText)
      },
      () => { /* scan error — ignore */ }
    ).catch((err) => {
      console.error('[QR scanner] start failed', err)
      setResult({ error: 'Camera access denied. Please allow camera permission.' })
      setState('error')
    })

    return () => {
      scanner.stop().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleQRCode(qrCode: string) {
    try {
      const res = await fetch('/api/attendance/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, archerId }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ sessionName: data.sessionName, archerName: data.archerName })
        setState('success')
        setTimeout(() => router.push('/attendance'), 3000)
      } else {
        setResult({ error: data.error ?? 'Check-in failed.' })
        setState('error')
      }
    } catch {
      setResult({ error: 'Network error. Please try again.' })
      setState('error')
    }
  }

  return (
    <>
      <style>{SCANNING_CSS}</style>
      <div style={{
        width: '100%', minHeight: '100dvh',
        background: '#0A0A0A',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Hidden html5-qrcode mount point */}
        <div id="qr-reader" style={{ position: 'absolute', inset: 0, opacity: state === 'active' || state === 'processing' ? 1 : 0 }} />

        {/* Top bar */}
        <div style={{
          position: 'relative', zIndex: 10,
          height: 52, display: 'flex', alignItems: 'center', padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4L12 12" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>QR Check-In</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Content area */}
        <div style={{
          position: 'relative', zIndex: 10,
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 32,
          padding: '0 24px',
        }}>

          {/* Active state */}
          {state === 'active' && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', margin: 0 }}>
                Point camera at the session QR code
              </p>
              {/* Viewfinder overlay */}
              <div style={{ width: 260, height: 260, position: 'relative' }}>
                <QRCornerBrackets color="#FFFFFF" />
                {/* Scan line */}
                <div style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  width: 220, height: 2,
                  background: 'linear-gradient(90deg, transparent, #2E7D4F 20%, #2E7D4F 80%, transparent)',
                  animation: 'qr-scan 2.4s ease-in-out infinite',
                  borderRadius: 1, zIndex: 2,
                }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', margin: 0 }}>
                The code will be scanned automatically
              </p>
            </>
          )}

          {/* Processing state */}
          {state === 'processing' && (
            <>
              <div style={{ width: 260, height: 260, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ animation: 'bracket-glow 1.5s ease-in-out infinite' }}>
                  <QRCornerBrackets color="#2E7D4F" />
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(46,125,79,0.25)', position: 'absolute',
                  }} />
                  <svg width="56" height="56" viewBox="0 0 56 56"
                    style={{ animation: 'qr-spin 1.2s linear infinite', position: 'relative', zIndex: 1 }}>
                    <circle cx="28" cy="28" r="24"
                      stroke="#2E7D4F" strokeWidth="3"
                      strokeDasharray="18 8" fill="none" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', margin: 0 }}>
                Verifying code…
              </p>
            </>
          )}

          {/* Success state */}
          {state === 'success' && (
            <>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ position: 'absolute' }}>
                  <circle cx="48" cy="48" r="46" fill="rgba(46,125,79,0.15)" stroke="#2E7D4F" strokeWidth="4" />
                </svg>
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" style={{ position: 'relative' }}>
                  <path d="M9 21L18 30L33 14" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>
                  Checked In!
                </p>
                {result.archerName && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 4px' }}>
                    {result.archerName}
                  </p>
                )}
                {result.sessionName && (
                  <p style={{ color: '#2E7D4F', fontSize: 14, margin: 0 }}>
                    {result.sessionName}
                  </p>
                )}
              </div>
              {/* Auto-dismiss bar */}
              <div style={{ width: '100%', maxWidth: 280 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: '#2E7D4F', borderRadius: 2,
                    animation: 'dismiss-bar 3s linear forwards',
                  }} />
                </div>
                <p style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                  Closing in 3s…
                </p>
              </div>
            </>
          )}

          {/* Error state */}
          {state === 'error' && (
            <>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ position: 'absolute' }}>
                  <circle cx="48" cy="48" r="46" fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.7)" strokeWidth="4" />
                </svg>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ position: 'relative' }}>
                  <path d="M18 10V20" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="18" cy="27" r="2" fill="#EF4444" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
                  Check-In Failed
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
                  {result.error ?? 'QR code is invalid or has expired.'}
                </p>
              </div>
              <button
                onClick={() => { setState('active') }}
                style={{
                  padding: '14px 40px', borderRadius: 14,
                  background: '#2E7D4F', border: 'none', color: '#FFFFFF',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
