'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ScanState = 'loading' | 'active' | 'detecting' | 'success' | 'error'

interface ScanResult {
  sessionName?: string
  archerName?: string
  error?: string
}

interface FaceDescriptor {
  archerId: string | number
  descriptor: number[]
}

const CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
const MODEL_STEPS = ['Face detector (1/3)', 'Face landmarks (2/3)', 'Face recognition (3/3)']

const SCANNING_CSS = `
  @keyframes face-pulse-ring {
    0%, 100% { opacity: 0.22; transform: scale(1); }
    50%       { opacity: 0.48; transform: scale(1.030); }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 24px rgba(46,125,79,0.5), 0 0 0 4px #2E7D4F; }
    50%       { box-shadow: 0 0 56px rgba(46,125,79,0.85), 0 0 0 4px #2E7D4F; }
  }
  @keyframes dismiss-bar {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes dot-a {
    0%,100% { opacity: 0.28; } 20%,40% { opacity: 1; }
  }
  @keyframes dot-b {
    0%,100% { opacity: 0.28; } 35%,55% { opacity: 1; }
  }
  @keyframes dot-c {
    0%,100% { opacity: 0.28; } 50%,70% { opacity: 1; }
  }
`

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0))
}

function FaceLandmarkDots({ color = 'rgba(255,255,255,0.85)' }: { color?: string }) {
  const dots: [string, string, string][] = [
    ['32%', '34%', 'L-Eye'],
    ['68%', '34%', 'R-Eye'],
    ['50%', '54%', 'Nose'],
    ['36%', '70%', 'L-Mouth'],
    ['64%', '70%', 'R-Mouth'],
  ]
  return (
    <>
      {dots.map(([left, top, key]) => (
        <div key={key} style={{
          position: 'absolute', left, top,
          transform: 'translate(-50%, -50%)',
          width: 6, height: 6, borderRadius: '50%',
          background: color, boxShadow: `0 0 5px ${color}`,
        }} />
      ))}
    </>
  )
}

function FaceOvalGuide({ state }: { state: 'active' | 'detecting' }) {
  const borderColor = state === 'detecting' ? '#2E7D4F' : 'rgba(255,255,255,0.65)'
  const dotColor = state === 'detecting' ? '#4ADE80' : 'rgba(255,255,255,0.85)'
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {state === 'detecting' && (
        <div style={{
          position: 'absolute', width: 248, height: 308, borderRadius: '50%',
          background: 'rgba(46,125,79,0.28)',
          animation: 'face-pulse-ring 1.8s ease-in-out infinite',
        }} />
      )}
      <div style={{
        width: 220, height: 280, borderRadius: '50%',
        border: `3px ${state === 'active' ? 'dashed' : 'solid'} ${borderColor}`,
        position: 'relative', overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}>
        <FaceLandmarkDots color={dotColor} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.12) 100%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}

export default function FaceScannerClient() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionLoopRef = useRef<number | null>(null)
  const [state, setState] = useState<ScanState>('loading')
  const [result, setResult] = useState<ScanResult>({})
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [loadStep, setLoadStep] = useState(0)

  // Load face-api models and start camera
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera not supported on this device.')
        }

        const faceapi = (await import('face-api.js')).default
        const nets = [
          faceapi.nets.tinyFaceDetector,
          faceapi.nets.faceLandmark68TinyNet,
          faceapi.nets.faceRecognitionNet,
        ]
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

        setState('active')
      } catch (err) {
        console.error('[FaceScanner] init failed', err)
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : ''
          let errorMsg = 'Could not start camera or load models.'
          if (msg === 'timeout') {
            errorMsg = 'Models are taking too long. Check your internet connection and try again.'
          } else if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
            errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.'
          } else if (msg.toLowerCase().includes('not supported')) {
            errorMsg = msg
          }
          setResult({ error: errorMsg })
          setState('error')
        }
      }
    }

    init()
    return () => {
      cancelled = true
      if (detectionLoopRef.current) cancelAnimationFrame(detectionLoopRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) return
    const faceapi = (await import('face-api.js')).default

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor()

    if (!detection) {
      setState('active')
      detectionLoopRef.current = requestAnimationFrame(runDetection)
      return
    }

    setState('detecting')

    // Fetch enrolled descriptors
    const res = await fetch('/api/face-data')
    if (!res.ok) {
      setResult({ error: 'Could not load enrolled faces.' })
      setState('error')
      return
    }
    const { descriptors } = await res.json() as { descriptors: FaceDescriptor[] }

    if (!descriptors?.length) {
      setResult({ error: 'No enrolled faces found. Please enroll first.' })
      setState('error')
      return
    }

    // Find best match
    const queryDescriptor = Array.from(detection.descriptor) as number[]
    let bestDist = Infinity
    let bestArcherId: string | number = ''

    for (const { archerId, descriptor } of descriptors) {
      const dist = euclideanDistance(queryDescriptor, descriptor)
      if (dist < bestDist) {
        bestDist = dist
        bestArcherId = archerId
      }
    }

    if (bestDist >= 0.5) {
      setResult({ error: 'Face not recognised. Please try again or check in manually.' })
      setState('error')
      return
    }

    // POST attendance
    const attendRes = await fetch('/api/attendance/face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archerId: String(bestArcherId), matchConfidence: bestDist }),
    })
    const attendData = await attendRes.json()

    if (attendRes.ok) {
      setResult({ sessionName: attendData.sessionName, archerName: attendData.archerName })
      setState('success')
      streamRef.current?.getTracks().forEach(t => t.stop())
      setTimeout(() => router.push('/attendance'), 3000)
    } else {
      setResult({ error: attendData.error ?? 'Check-in failed.' })
      setState('error')
    }
  }, [modelsLoaded, router])

  // Start detection loop when active
  useEffect(() => {
    if (state === 'active' && modelsLoaded) {
      const loop = async () => {
        if (state !== 'active') return
        await runDetection()
      }
      const timeout = setTimeout(loop, 800)
      return () => clearTimeout(timeout)
    }
  }, [state, modelsLoaded, runDetection])

  const tryAgain = () => {
    setState('active')
    setResult({})
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
        {/* Camera feed */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: (state === 'active' || state === 'detecting') ? 1 : 0,
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.48)',
          pointerEvents: 'none',
        }} />

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
            <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>Face Check-In</span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 10,
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 32,
          padding: '0 24px',
        }}>

          {/* Loading state */}
          {state === 'loading' && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                {['dot-a', 'dot-b', 'dot-c'].map(anim => (
                  <div key={anim} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#2E7D4F', animation: `${anim} 1.4s ease-in-out infinite`,
                  }} />
                ))}
              </div>
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textAlign: 'center', margin: 0 }}>
                {modelsLoaded ? 'Starting camera…' : `Loading ${MODEL_STEPS[loadStep]}…`}
              </p>
            </>
          )}

          {/* Active / Detecting state */}
          {(state === 'active' || state === 'detecting') && (
            <>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', margin: 0 }}>
                {state === 'active' ? 'Position your face in the oval' : 'Recognising…'}
              </p>
              <FaceOvalGuide state={state} />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', margin: 0 }}>
                {state === 'active' ? 'Hold still for a moment' : 'Please wait…'}
              </p>
            </>
          )}

          {/* Success state */}
          {state === 'success' && (
            <>
              <div style={{
                width: 96, height: 96, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative', animation: 'glow-pulse 2s ease-in-out infinite',
              }}>
                <svg width="96" height="96" viewBox="0 0 96 96" fill="none" style={{ position: 'absolute' }}>
                  <circle cx="48" cy="48" r="46" fill="rgba(46,125,79,0.15)" stroke="#2E7D4F" strokeWidth="4" />
                </svg>
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none" style={{ position: 'relative' }}>
                  <path d="M9 21L18 30L33 14" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Checked In!</p>
                {result.archerName && (
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, margin: '0 0 4px' }}>{result.archerName}</p>
                )}
                {result.sessionName && (
                  <p style={{ color: '#2E7D4F', fontSize: 14, margin: 0 }}>{result.sessionName}</p>
                )}
              </div>
              <div style={{ width: '100%', maxWidth: 280 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#2E7D4F', borderRadius: 2, animation: 'dismiss-bar 3s linear forwards' }} />
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
                width: 96, height: 96, display: 'flex',
                alignItems: 'center', justifyContent: 'center', position: 'relative',
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
                  Not Recognised
                </p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0 }}>
                  {result.error ?? 'Face not recognised. Please try again.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={tryAgain}
                  style={{
                    padding: '14px 28px', borderRadius: 14,
                    background: '#2E7D4F', border: 'none', color: '#FFFFFF',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/scan/qr')}
                  style={{
                    padding: '14px 28px', borderRadius: 14,
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Use QR
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
