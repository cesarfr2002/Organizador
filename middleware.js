import { NextResponse } from 'next/server';

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  
  // Fix the path checking logic - Ensure login path with or without trailing slash is properly excluded
  if (
    path === '/login' || 
    path === '/login/' ||
    path.startsWith('/_next/') ||
    path.startsWith('/api/') ||
    path.includes('.js') ||
    path.includes('.json') ||
    path.includes('.ico') ||
    path.includes('.png') ||
    path.includes('.svg') ||
    path.includes('.css')
  ) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = req.cookies.get('user_session');
  
  // If no session, redirect to login
  if (!sessionCookie) {
    // Use NextResponse.redirect with absolute URL to avoid path issues
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Simplify the matcher to avoid regex issues
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api (API routes)
     * 2. /_next (Next.js internals)
     * 3. /static files with extensions (.js, .map, .ico, .png, etc)
     */
    '/((?!_next/|api/|.*\\.(js|json|map|ico|png|jpg|svg|css)).*)'
  ],
};
