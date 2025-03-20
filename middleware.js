import { NextResponse } from 'next/server';

// A much simpler middleware that only handles basic public routes
// Most authentication happens client-side with Netlify Identity
export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // List of public paths
  const publicPaths = [
    '/login', 
    '/api', 
    '/404', 
    '/500', 
    '/_next', 
    '/static', 
    '/images', 
    '/icons', 
    '/service-worker.js', 
    '/manifest.json',
    '/favicon.ico'
  ];
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
  
  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Check for Netlify Identity JWT cookie
  const netlifyIdentityCookie = req.cookies.get('nf_jwt');
  
  // If no auth cookie exists, redirect to login
  if (!netlifyIdentityCookie) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURI(req.url));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};
