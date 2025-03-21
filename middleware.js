import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // Always allow access to these paths without authentication
  if (
    path === '/login' ||
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('sw.js') ||
    path.includes('workbox-') ||
    path.includes('worker-') ||
    path.includes('manifest.json')
  ) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = req.cookies.get('user_session');
  
  // If no session, redirect to login
  if (!sessionCookie) {
    // Create simpler URL to avoid encoding issues
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', path);
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
