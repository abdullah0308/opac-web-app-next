// OPAC service worker
// Strategy: never cache personal data. Only immutable/static assets are stored.
// Navigations go to the network and fall back to a static offline page.

const VERSION = 'v2'
const STATIC_CACHE = `opac-static-${VERSION}`
const OFFLINE_URL = '/offline'

// Cached on install so the app shell still renders with no connection.
const PRECACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

// Path prefixes safe to cache: build output and static media only.
const STATIC_PREFIXES = ['/_next/static/', '/icons/', '/images/', '/fonts/', '/models/']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(STATIC_CACHE)
      // Individual puts so one 404 can't reject the whole install.
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Logout clears everything we hold, belt-and-braces.
self.addEventListener('message', (e) => {
  if (e.data === 'CLEAR_CACHES') {
    e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))))
  }
})

function isStaticAsset(url) {
  return STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Page loads: always hit the network so auth redirects and fresh data win.
  // Nothing here is cached — these responses are user-specific.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)))
    return
  }

  // Static assets: cache-first, they're content-hashed or versioned.
  if (isStaticAsset(url)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const clone = res.clone()
              caches.open(STATIC_CACHE).then((c) => c.put(req, clone))
            }
            return res
          })
      )
    )
    return
  }

  // Everything else (API, RSC payloads, Payload admin) — network only, never stored.
})
