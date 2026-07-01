import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const publicPaths = ['/login', '/register', '/', '/_next', '/api/auth', '/favicon.ico']
const adminPaths = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow public static files
  if (pathname.startsWith('/api') && pathname.includes('/questions') && request.method === 'GET') {
    return NextResponse.next()
  }

  const token = request.cookies.get('campus-qa-token')?.value
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin route check
  if (adminPaths.some(p => pathname.startsWith(p)) && payload.role !== 'admin') {
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
}
