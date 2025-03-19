import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  try {
    const path = req.nextUrl.pathname
    console.log('========== MIDDLEWARE EXECUTION ==========');
    console.log('Middleware running for path:', path);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', JSON.stringify(Object.fromEntries(req.headers), null, 2));
    console.log('Cookies present:', !!req.cookies);
    
    // Public paths that don't require authentication
    const publicPaths = ['/login', '/api/auth', '/404', '/500', '/favicon.ico']
    const isPublicPath = publicPaths.some(publicPath => 
      path === publicPath || path.startsWith(`${publicPath}/`)
    )
    
    console.log('Is public path?', isPublicPath);
    
    // Also bypass static files and API routes (except those that need auth)
    if (path.startsWith('/_next/') || 
        path.includes('/static/') || 
        path.match(/\.(png|jpg|jpeg|svg|gif|ico)$/i) ||
        isPublicPath) {
      console.log('Bypassing auth check for:', path);
      console.log('========== END MIDDLEWARE (BYPASS) ==========');
      return NextResponse.next()
    }
    
    // Check if the user is authenticated
    console.log('Checking authentication token...');
    const tokenParams = { 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    };
    console.log('Token params - has secret:', !!tokenParams.secret);
    console.log('Token params - secure cookie:', tokenParams.secureCookie);
    
    const token = await getToken(tokenParams);
    console.log('Authentication token present?', !!token);
    
    // Redirect unauthenticated users to login
    if (!token) {
      console.log('No auth token - redirecting to login');
      const loginUrl = new URL('/login', req.url);
      // Only add callbackUrl if we have a valid URL to return to
      if (req.url && req.url.startsWith('http')) {
        loginUrl.searchParams.set('callbackUrl', req.url);
        console.log('Added callback URL:', req.url);
      }
      console.log('Redirecting to:', loginUrl.toString());
      console.log('========== END MIDDLEWARE (REDIRECT) ==========');
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('User authenticated, proceeding to requested path');
    console.log('========== END MIDDLEWARE (AUTHENTICATED) ==========');
    return NextResponse.next();
  } catch (error) {
    console.error('========== MIDDLEWARE ERROR ==========');
    console.error('Middleware error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========== END MIDDLEWARE ERROR ==========');
    // In case of error, allow the request to proceed to avoid blocking legitimate traffic
    return NextResponse.next();
  }
}

// Replace the complex regex matcher with simpler patterns
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (image files)
     * - public/ files with image extensions (.png, .jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
}
