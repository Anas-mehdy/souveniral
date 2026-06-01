import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware — Admin route protection
 *
 * Any request to /admin/* (except /admin/login) is redirected to the login
 * page if the admin_token cookie is absent.
 *
 * NOTE: This is a lightweight first-pass guard using the cookie presence only.
 * Full token validity (expiry check against DB) is still verified in each API
 * route handler via isAdminAuthenticated(), so this is defense-in-depth.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow the login page itself through unconditionally
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Protect all other /admin/* paths
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value

    if (!token) {
      const loginUrl = new URL('/admin/login', req.url)
      // Preserve the original destination so we can redirect back after login
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only run middleware on /admin/* routes — keeps it out of the hot path
  // for all storefront and API calls.
  matcher: ['/admin/:path*'],
}
