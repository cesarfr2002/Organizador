import { NextResponse } from 'next/server';

export async function middleware(req) {
  // Get path
  const path = req.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/register',
    '/api/custom-login',
  ];

  // Static assets and resources
  if (path.startsWith('/_next') || 
      path.startsWith('/static') ||
      path.startsWith('/images') ||
      path.startsWith('/fonts') ||
      path.includes('favicon.ico') || 
      path.includes('.webmanifest') ||
      path.includes('manifest.json') ||
      path.includes('sw.js')) {
    return NextResponse.next();
  }

  // Allow access to public paths
  if (publicPaths.some(publicPath => path === publicPath || path.startsWith(publicPath + '/'))) {
    return NextResponse.next();
  }

  // Very simple auth check - just check if the user JSON is in localStorage
  // For server-side middleware, we can't access localStorage, so we'll look for our custom cookie
  // This is a simplified approach for Netlify deployment
  if (path.startsWith('/api/')) {
    // For API routes, just allow all requests for now
    return NextResponse.next();
  }

  // For non-API routes, check if there's a session cookie
  const authCookie = req.cookies.get('auth_session');
  
  // If no cookie and not on a public path, redirect to login
  if (!authCookie && !publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Define which paths this middleware applies to
export const config = {
  matcher: ['/((?!api/auth).*)']  // Apply to all routes except NextAuth routes
};
