import { NextRequest, NextResponse } from 'next/server'

// Routes that bypass the token check entirely
const PUBLIC_PREFIXES = [
  '/login',
  '/forgot-password',
  '/api/auth/',
  '/api/payload/',
  '/api/webhooks/',
  '/api/db-push',
  '/api/db-migrate',
  '/api/seed',
  '/api/seed-update',
  '/setup/profile',
  // Payload CMS panel handles its own authentication
  '/admin',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('payload-token')?.value

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  // Unauthenticated → /login
  if (!isPublic && !token) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect_url', pathname)
    return NextResponse.redirect(url)
  }

  // Root → /dashboard
  if (pathname === '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Already logged in → skip login page
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
