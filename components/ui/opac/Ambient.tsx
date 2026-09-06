/**
 * OPAC Design System — ambient field.
 *
 * The whole app floats on this. It is drawn rather than photographed on
 * purpose: the app is an installable PWA that has to open on a range with bad
 * signal, and a full-bleed photo would be the heaviest thing we ship. Layered
 * gradients cost nothing, scale to any screen, and never pixelate.
 *
 * Five colour fields drift at different speeds, a target face sits behind the
 * top-right corner, a diagonal light sweep crosses the whole thing, and a fine
 * grain stops the large blurs from banding.
 */
export function Ambient() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background:
          'linear-gradient(168deg, #F0F4EA 0%, #E3EDE4 38%, #E8EBDC 68%, #F0EADA 100%)',
      }}
    >
      {/* ── Colour fields ──────────────────────────────────────────────── */}
      <div
        className="absolute -top-[22%] -left-[26%] w-[86vw] h-[86vw] max-w-[780px] max-h-[780px] rounded-full blur-[80px] animate-drift-a"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(46,125,79,0.55) 0%, rgba(46,125,79,0.22) 42%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[6%] -right-[24%] w-[78vw] h-[78vw] max-w-[700px] max-h-[700px] rounded-full blur-[86px] animate-drift-b"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(24,132,116,0.44) 0%, rgba(24,132,116,0.16) 45%, transparent 72%)',
        }}
      />
      <div
        className="absolute top-[46%] -right-[18%] w-[74vw] h-[74vw] max-w-[660px] max-h-[660px] rounded-full blur-[92px] animate-drift-c"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(212,160,23,0.46) 0%, rgba(212,160,23,0.18) 46%, transparent 72%)',
        }}
      />
      <div
        className="absolute -bottom-[26%] -left-[14%] w-[92vw] h-[92vw] max-w-[820px] max-h-[820px] rounded-full blur-[100px] animate-drift-b"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(15,51,32,0.38) 0%, rgba(15,51,32,0.14) 44%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-[30%] left-[22%] w-[60vw] h-[60vw] max-w-[520px] max-h-[520px] rounded-full blur-[80px] animate-drift-a"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(255,252,240,0.85) 0%, rgba(255,250,232,0.30) 45%, transparent 70%)',
        }}
      />

      {/* ── Target face, sunk into the top right ───────────────────────── */}
      <svg
        className="absolute -top-[8%] -right-[16%] w-[76vw] max-w-[560px] h-auto opacity-[0.11] animate-drift-c"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="96" stroke="#0F3320" strokeWidth="1.6" />
        <circle cx="100" cy="100" r="80" stroke="#0F3320" strokeWidth="1.6" />
        <circle cx="100" cy="100" r="64" stroke="#0F3320" strokeWidth="1.6" />
        <circle cx="100" cy="100" r="48" stroke="#2E7D4F" strokeWidth="1.8" />
        <circle cx="100" cy="100" r="32" stroke="#2E7D4F" strokeWidth="1.8" />
        <circle cx="100" cy="100" r="18" stroke="#D4A017" strokeWidth="2.2" />
        <circle cx="100" cy="100" r="7" fill="#D4A017" />
      </svg>

      {/* ── Second, smaller target low-left for balance ────────────────── */}
      <svg
        className="absolute bottom-[6%] -left-[10%] w-[46vw] max-w-[300px] h-auto opacity-[0.07] animate-drift-a"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="92" stroke="#0F3320" strokeWidth="2" />
        <circle cx="100" cy="100" r="68" stroke="#0F3320" strokeWidth="2" />
        <circle cx="100" cy="100" r="44" stroke="#0F3320" strokeWidth="2" />
        <circle cx="100" cy="100" r="20" stroke="#0F3320" strokeWidth="2" />
      </svg>

      {/* ── Diagonal light sweep ───────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(118deg, transparent 18%, rgba(255,255,255,0.42) 38%, rgba(255,255,255,0.10) 52%, transparent 68%)',
        }}
      />

      {/* ── Lift the top, settle the bottom ────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.34) 0%, transparent 26%, transparent 74%, rgba(28,48,32,0.10) 100%)',
        }}
      />

      {/* ── Vignette ───────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 42%, transparent 42%, rgba(30,48,34,0.13) 100%)',
        }}
      />

      {/* ── Grain ──────────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.30] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  )
}
