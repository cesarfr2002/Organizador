import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api', 
    '/404', 
    '/500', 
    '/service-worker.js', 
    '/manifest.json'
  ];
  
  const isPublicPath = publicPaths.some((publicPath) => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  );
  
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Solo comprobamos si hay una cookie de sesión simple
  const sessionCookie = req.cookies.get('user_session');
  
  // Si no hay cookie, redirigir al login
  if (!sessionCookie) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURI(req.url));
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Specify which paths middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.png$).*)',
  ],
};
