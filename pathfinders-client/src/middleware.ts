import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/', '/login', '/register', '/forgot-password', '/debug', '/donate'];

// Counselor paths that have their own authentication flow
const counselorPaths = [
  '/counselor-access',
  '/counselor-access/login',
  '/counselor-access/register'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow access to landing page and other public paths
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow access to counselor paths without regular user authentication
  if (counselorPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Counselor dashboard paths should check for counselor token in localStorage
  // But this check happens client-side in the CounselorLayout component
  if (pathname.startsWith('/counselor/')) {
    return NextResponse.next();
  }

  // Check for authentication cookie for regular user paths
  const sessionCookie = request.cookies.get('sessionid');
  const isAuthenticated = !!sessionCookie;

  // Check auth for protected routes
  if (!isAuthenticated) {
    const from = pathname;
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', from);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 