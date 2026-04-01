'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type EnrollState = 'loading' | 'ready' | 'capturing' | 'success' | 'error'

const ENROLL_CSS = `
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 24px rgba(46,125,79,0.5); }
    50%       { box-shadow: 0 0 56px rgba(46,125,79,0.85); }
  }
  @keyframes face-pulse-ring {
    0%, 100% { opacity: 0.22; transform: scale(1); }
    50%       { opacity: 0.48; transform: scale(1.030); }
  }
`

const CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
const MODEL_STEPS = [
  'Face detector (1/3)',
  'Face landmarks (2/3)',
  'Face recognition (3/3)',
]

export default function FaceEnrollClient() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [state, setState] = useState<EnrollState>('loading')
  const [loadStep, setLoadStep] = useState(0)
  const [error, setError] = useState('')
  const [modelsLoaded, setModelsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Check camera permission first
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera not supported on this device.')
        }

        const faceapi = (await import('face-api.js')).default

        // Load models sequentially with progress + 30s timeout per model
        const nets = [
          faceapi.nets.tinyFaceDetector,
          faceapi.nets.faceLandmark68TinyNet,
          faceapi.nets.faceRecognitionNet,
        ]
        // Timeouts: recognition model is ~6 MB so gets 90 s; others 30 s
        const timeouts = [30000, 30000, 90000]
        for (let i = 0; i < nets.length; i++) {
          if (cancelled) return
          setLoadStep(i)
          await Promise.race([
            nets[i].loadFromUri(CDN),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), timeouts[i])),
          ])
        }
        if (cancelled) return
        setModelsLoaded(true)

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setState('ready')
      } catch (err) {
        console.error('[FaceEnroll] init', err)
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : ''
          if (msg === 'timeout') {
            setError('Models are taking too long. Check your internet connection and try again.')
          } else if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
            setError('Camera permission denied. Please allow camera access in your browser settings.')
          } else if (msg.toLowerCase().includes('not supported')) {
            setError(msg)
          } else {
            setError('Could not start camera or load face detection models.')
          }
          setState('error')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  async function handleCapture() {
    if (!videoRef.current || !modelsLoaded) return
    setState('capturing')

    try {
      const faceapi = (await import('face-api.js')).default
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceDescriptor()

      if (!detection) {
        setError('No face detected. Please position your face clearly and try again.')
        setState('error')
        return
      }

      const descriptor = Array.from(detection.descriptor)
      const res = await fetch('/api/face-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor }),
      })

      if (res.ok) {
        streamRef.current?.getTracks().forEach(t => t.stop())
        setState('success')
        // Mark onboarding complete then go to dashboard
        await fetch('/api/complete-setup', { method: 'POST' }).catch(() => {})
        setTimeout(() => { window.location.href = '/dashboard' }, 2500)
      } else {
        const data = await res.json()
        setError(data.error ?? 'Enrollment failed.')
        setState('error')
      }
    } catch (err) {
      console.error('[FaceEnroll] capture', err)
      setError('An error occurred. Please try again.')
      setState('error')
    }
  }

  return (
    <>
      <style>{ENROLL_CSS}</style>
      <div style={{
        width: '100%', minHeight: '100dvh',
        background: '#F8FAF8',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Top bar */}
        <div style={{
          height: 56, background: '#FFFFFF',
          borderBottom: '1px solid #E8EDE8',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
          boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: '#F2F5F2', border: '1px solid #E0E8E0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9L11 4" stroke="#1A2B1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, color: '#1A2B1A' }}>
            Face Enrolment
          </span>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 28, padding: '32px 24px',
        }}>
          {/* Camera preview oval */}
          {(state === 'loading' || state === 'ready' || state === 'capturing') && (
            <div style={{
              width: 240, height: 300, borderRadius: '50%', overflow: 'hidden',
              border: `3px solid ${state === 'capturing' ? '#2E7D4F' : '#D0DDD0'}`,
              position: 'relative', background: '#E8EEE8',
              transition: 'border-color 0.3s',
            }}>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
              {state === 'loading' && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(248,250,248,0.8)',
                }}>
                  <span style={{ fontSize: 14, color: '#4A6A4A' }}>Loading…</span>
                </div>
              )}
            </div>
          )}

          {/* Success circle */}
          {state === 'success' && (
            <div style={{
              width: 96, height: 96,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', animation: 'glow-pulse 2s ease-in-out infinite',
            }}>
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ position: 'absolute' }}>
                <circle cx="48" cy="48" r="46" fill="rgba(46,125,79,0.15)" stroke="#2E7D4F" strokeWidth="4" />
              </svg>
              <svg width="42" height="42" viewBox="0 0 42 42" fill="none" style={{ position: 'relative' }}>
                <path d="M9 21L18 30L33 14" stroke="#2E7D4F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Text */}
          <div style={{ textAlign: 'center' }}>
            {state === 'loading' && (
              <p style={{ color: '#4A6A4A', fontSize: 15, margin: 0 }}>
                {modelsLoaded ? 'Starting camera…' : `Loading ${MODEL_STEPS[loadStep]}…`}
              </p>
            )}
            {state === 'ready' && (
              <>
                <p style={{ color: '#1A2B1A', fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>
                  Set Up Face Check-In
                </p>
                <p style={{ color: '#5A7A5A', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
                  Position your face in the oval and tap Capture.{' '}
                  Your face data is stored securely and only used for attendance.
                </p>
              </>
            )}
            {state === 'capturing' && (
              <p style={{ color: '#2E7D4F', fontSize: 15, fontWeight: 600, margin: 0 }}>
                Scanning face…
              </p>
            )}
            {state === 'success' && (
              <>
                <p style={{ color: '#1A2B1A', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
                  Enrolment Complete!
                </p>
                <p style={{ color: '#4A6A4A', fontSize: 14, margin: 0 }}>
                  You can now use face check-in at each session.
                </p>
              </>
            )}
            {state === 'error' && (
              <>
                <p style={{ color: '#C0392B', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
                  Enrolment Failed
                </p>
                <p style={{ color: '#5A7A5A', fontSize: 14, margin: 0 }}>{error}</p>
              </>
            )}
          </div>

          {/* Actions */}
          {state === 'ready' && (
            <button
              onClick={handleCapture}
              style={{
                padding: '16px 48px', borderRadius: 16,
                background: '#2E7D4F', border: 'none',
                color: '#FFFFFF', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(46,125,79,0.3)',
              }}
            >
              Capture Face
            </button>
          )}
          {state === 'error' && (
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => { setState('ready'); setError('') }}
                style={{
                  padding: '14px 28px', borderRadius: 14,
                  background: '#2E7D4F', border: 'none', color: '#FFFFFF',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                style={{
                  padding: '14px 28px', borderRadius: 14,
                  background: '#F2F5F2', border: '1px solid #D0DDD0',
                  color: '#2A4A2A', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
