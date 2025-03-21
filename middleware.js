import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // Simple path checking for public routes that don't need authentication
  if (
    path === '/login' || 
    path === '/login/' ||
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.endsWith('.js') ||
    path.endsWith('.json') ||
    path.endsWith('.map') ||
    path.endsWith('.ico') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path.endsWith('.css')
  ) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = req.cookies.get('user_session');
  
  // If no session, redirect to login
  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Use a simple fixed list of paths to apply middleware to instead of a complex regex
export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/profile',
    '/profile/:path*',
    '/tasks',
    '/tasks/:path*',
    '/calendar',
    '/calendar/:path*',
    '/notes',
    '/notes/:path*',
    '/settings',
    '/settings/:path*'
  ],
};
