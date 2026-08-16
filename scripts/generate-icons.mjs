/**
 * Generates the PWA icon set from the club logo.
 *
 *   node scripts/generate-icons.mjs
 *
 * Source: public/icons/logo-source.png (transparent RGBA).
 * Uses sharp, which ships with Next.js — no extra dependency.
 *
 * Two variants are produced per size:
 *   any      — logo fills most of the tile, for browsers that don't mask
 *   maskable — logo kept inside the safe zone, because Android crops to a
 *              circle/squircle and would otherwise cut into the wordmark
 */

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ICONS = path.resolve(dirname, '../public/icons')
const SOURCE = path.join(ICONS, 'logo-source.png')

// opac-bg from tailwind.config.ts. The logo's dark mark and green wordmark
// need a light ground — they vanish on the brand green.
const BG = { r: 0xf8, g: 0xf6, b: 0xf1, alpha: 1 }

// Fraction of the tile the logo occupies.
const ANY_SCALE = 0.88
// The maskable safe zone is a circle of 80% diameter; a square inscribed in it
// is ~57%. 0.62 is a small, deliberate overshoot — the logo's corners are
// transparent, so nothing meaningful sits there.
const MASKABLE_SCALE = 0.62

/** Trim the transparent border so framing doesn't depend on source padding. */
async function trimmedLogo() {
  return sharp(SOURCE).trim().png().toBuffer()
}

async function render({ logo, size, scale, out, flatten }) {
  const inner = Math.round(size * scale)

  const resized = await sharp(logo)
    .resize(inner, inner, { fit: 'inside' })
    .toBuffer()

  let canvas = sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  }).composite([{ input: resized, gravity: 'center' }])

  // iOS renders transparency poorly on home screen tiles.
  if (flatten) canvas = canvas.flatten({ background: BG })

  await canvas.png().toFile(path.join(ICONS, out))
  console.log(`  ${out.padEnd(28)} ${size}x${size}`)
}

const logo = await trimmedLogo()
const meta = await sharp(logo).metadata()
console.log(`source trimmed to ${meta.width}x${meta.height}\n`)

await render({ logo, size: 192, scale: ANY_SCALE, out: 'icon-192.png' })
await render({ logo, size: 512, scale: ANY_SCALE, out: 'icon-512.png' })
await render({ logo, size: 192, scale: MASKABLE_SCALE, out: 'icon-192-maskable.png' })
await render({ logo, size: 512, scale: MASKABLE_SCALE, out: 'icon-512-maskable.png' })
await render({ logo, size: 180, scale: ANY_SCALE, out: 'apple-touch-icon.png', flatten: true })

console.log('\ndone')
