import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(req) {
  try {
    const path = req.nextUrl.pathname;
    console.log('========== MIDDLEWARE EXECUTION ==========');
    console.log('Middleware running for path:', path);
    
    // Public paths that don't require authentication
    const publicPaths = ['/login', '/api/auth', '/404', '/500', '/favicon.ico'];
    const isPublicPath = publicPaths.some(publicPath => 
      path === publicPath || path.startsWith(`${publicPath}/`)
    );
    
    // Also bypass static files
    if (path.startsWith('/_next/') || 
        path.includes('/static/') || 
        path.match(/\.(png|jpg|jpeg|svg|gif|ico)$/i) ||
        isPublicPath) {
      return NextResponse.next();
    }
    
    // Check if the user is authenticated
    const token = req.cookies.get('uorganizer_auth_token')?.value;
    const user = token ? verifyToken(token) : null;
    
    // Redirect unauthenticated users to login
    if (!user) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of error, allow the request to proceed
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
