import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pmx-prototype-secret-key-minimum-32-chars-long'
)

// Paths that never require authentication
const PUBLIC_PATHS = [
  '/',
  '/api/auth/login',
  '/api/auth/refresh',
]

const PUBLIC_PREFIXES = [
  '/_next/',
  '/favicon.ico',
  '/marketplace',
]

// Portal paths that require a session cookie
const PROTECTED_PREFIXES = [
  '/seller/',
  '/buyer/',
  '/admin/',
]

// Role-to-portal mapping for access control
const PORTAL_ALLOWED_ROLES: Record<string, string[]> = {
  '/seller/': ['SELLER_ADMIN', 'SELLER_QA', 'SELLER_RA', 'SELLER_OPERATOR', 'SELLER_VIEW', 'PMX_ADMIN'],
  '/buyer/': ['BUYER_ADMIN', 'PMX_ADMIN'],
  '/admin/': ['PMX_ADMIN'],
}

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes -- always allow
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // API routes (other than the public auth ones above) -- pass through
  // Server-side API handlers do their own auth checks
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Protected portal routes -- require cookie and role check
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get('pmx_token')?.value

    if (!token) {
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl)
    }

    // Decode JWT to check role (lightweight check, full auth in API routes)
    try {
      const { payload } = await jwtVerify(token, SECRET)
      const userId = (payload as Record<string, unknown>).userId

      if (!userId) {
        const loginUrl = new URL('/', request.url)
        return NextResponse.redirect(loginUrl)
      }

      // Check role-based portal access if we have role info in a cookie
      // For now, we allow through and let server components handle role checks
      // The API routes already enforce role-based access
    } catch {
      // Token invalid or expired -- redirect to login
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run middleware on all routes except static assets
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
