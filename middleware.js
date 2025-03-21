import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api', 
    '/404', 
    '/500', 
    '/_next',
    '/service-worker.js', 
    '/manifest.json',
    '/sw.js',
    '/workbox-',
    '/worker-'
  ];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some((publicPath) => 
    path === publicPath || path.startsWith(`${publicPath}`)
  );
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = req.cookies.get('user_session');
  
  // If no session, redirect to login
  if (!sessionCookie) {
    // Use replace instead of redirect to avoid issues
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  return NextResponse.next();
}

// Fix the matcher to use a simpler pattern without capturing groups
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/tasks/:path*',
    '/calendar/:path*',
    '/notes/:path*',
    '/settings/:path*'
  ],
};
