import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  // Get path
  const path = req.nextUrl.pathname;

  // If it's one of the public paths, allow access
  if (path === '/login' || path.startsWith('/api/') || path.startsWith('/_next') || path.startsWith('/static')) {
    return NextResponse.next();
  }

  const session = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || '57dd7df0034aacd3fec020a220930081d9d3e9318b54c082b55cad978f57c064' 
  });

  // If no session and not on login page, redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Session exists, continue
  return NextResponse.next();
}

// See: https://nextjs.org/docs/advanced-features/middleware
export const config = {
  matcher: [
    '/((?!api|_next|fonts|images|favicon.ico|manifest.json).*)',
  ],
};
