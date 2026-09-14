import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authCookie = req.cookies.get('admin_auth')?.value
  const isAdmin = authCookie === 'faivyyy23'

  // Ignore /admin/login to avoid infinite redirects
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAdmin) {
      const loginUrl = new URL('/admin/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Coming soon feature (only for non-admin visitors)
  if (process.env.NEXT_PUBLIC_COMING_SOON === 'true') {
    if (!isAdmin && !pathname.startsWith('/admin') && pathname !== '/coming-soon') {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-coming-soon', 'true')
      
      return NextResponse.rewrite(new URL('/coming-soon', req.url), {
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
