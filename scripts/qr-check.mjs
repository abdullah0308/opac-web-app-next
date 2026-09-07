/**
 * Reproduces exactly what the qrcode library does to a canvas element, so the
 * stretch bug can be checked without a browser session.
 *
 * The library sets style.width / style.height in pixels directly on the
 * element. Those inline values outrank any class, which is what pinned the
 * height at 620px while max-width squeezed the width.
 */

// Minimal stand-in for a canvas element's style box.
function makeCanvas() {
  return { width: 0, height: 0, style: {} }
}

// What node-qrcode's browser renderer does (renderer/canvas.js).
function qrcodeRender(canvas, size) {
  canvas.width = size
  canvas.height = size
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
}

// Resolve the rendered box the way a browser would, given inline styles plus
// the CSS the component applies.
function resolveBox(canvas, css, containerWidth) {
  const intrinsicRatio = canvas.width / canvas.height

  let width
  if (css.width === '100%') width = containerWidth
  else if (canvas.style.width) width = parseFloat(canvas.style.width)
  else width = canvas.width
  if (css.maxWidth != null) width = Math.min(width, css.maxWidth)

  let height
  if (css.height === 'auto') height = width / intrinsicRatio
  else if (canvas.style.height) height = parseFloat(canvas.style.height)
  else height = canvas.height

  return { width, height, ratio: width / height }
}

const VIEWPORT = 390 // a typical phone
const containerWidth = Math.min(0.78 * VIEWPORT, 420)

console.log(`\nViewport ${VIEWPORT}px → wrapper is ${containerWidth}px wide\n`)

// ── Before: class-based sizing, beaten by the library's inline styles ──────
const before = makeCanvas()
qrcodeRender(before, 620)
const beforeBox = resolveBox(
  before,
  { maxWidth: containerWidth, height: 'auto' }, // h-auto class — loses to inline
  containerWidth,
)
// The class cannot win, so height stays at the inline value.
beforeBox.height = parseFloat(before.style.height)
beforeBox.ratio = beforeBox.width / beforeBox.height

// ── After: inline styles cleared, wrapper owns the width ──────────────────
const after = makeCanvas()
qrcodeRender(after, 620)
after.style.width = '100%'
after.style.height = 'auto'
const afterBox = resolveBox(
  after,
  { width: '100%', height: 'auto' },
  containerWidth,
)

const fmt = (b) =>
  `${b.width.toFixed(0)} x ${b.height.toFixed(0)}px  (ratio ${b.ratio.toFixed(3)})`

console.log(`  before fix:  ${fmt(beforeBox)}`)
console.log(`  after fix:   ${fmt(afterBox)}`)

const square = Math.abs(afterBox.ratio - 1) < 0.001
const wasStretched = Math.abs(beforeBox.ratio - 1) > 0.05

console.log()
console.log(`  bug reproduced (was stretched): ${wasStretched ? 'yes' : 'NO — check the model'}`)
console.log(`  fixed (renders square):         ${square ? 'yes' : 'NO'}`)

if (!square || !wasStretched) process.exitCode = 1
