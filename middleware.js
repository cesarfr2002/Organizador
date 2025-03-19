import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function middleware(req) {
  // Get path
  const path = req.nextUrl.pathname;

  // If it's one of the public paths, allow access
  if (path === '/login' || path === '/api/custom-login' || path.startsWith('/_next') || path.startsWith('/static')) {
    return NextResponse.next();
  }

  // Check for auth token
  const authToken = req.cookies.get('auth_token')?.value;

  // If no token and not on login page, redirect to login
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // Verify token
    verify(
      authToken,
      process.env.NEXTAUTH_SECRET || '57dd7df0034aacd3fec020a220930081d9d3e9318b54c082b55cad978f57c064'
    );
    
    // Token is valid, continue
    return NextResponse.next();
  } catch (error) {
    console.error('Invalid token:', error);
    // Invalid token, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

// See: https://nextjs.org/docs/advanced-features/middleware
export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /fonts (inside /public)
     * 4. /images (inside /public)
     * 5. /favicon.ico, /manifest.json (inside /public)
     */
    '/((?!api|_next|fonts|images|favicon.ico|manifest.json).*)',
  ],
};
