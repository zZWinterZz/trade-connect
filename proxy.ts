import { NextResponse, type NextRequest } from 'next/server'

const protectedPaths = ['/dashboard', '/matches', '/listings', '/needs', '/connections', '/profile']

// Lightweight guard — checks for session cookie presence.
// Real session validation (DB hit) happens in the dashboard layout.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected) {
    const hasSession = request.cookies.has('better-auth.session_token')
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
