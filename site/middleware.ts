import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that redirects unauthenticated users to the login page.
 * It protects all routes under /manage, /events, /fests, and any other
 * page that requires a real user. Public routes (/, /login, /signup,
 * /demo, /api/*, /_next/*, /static/*) are excluded.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes that do not require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/demo',
    '/api',
    '/_next',
    '/static',
  ];

  // If the request is for a public path, allow it
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Simple auth check: Supabase sets the access token in a cookie named
  // `sb-access-token`. If the cookie is missing, we consider the user unauthenticated.
  const token = request.cookies.get('sb-access-token');
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated – allow request to continue
  return NextResponse.next();
}

export const config = {
  // Match all routes except the public ones defined above.
  matcher: '/((?!api/|_next/|static/|login|signup|demo).*)',
};
