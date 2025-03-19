import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const path = req.nextUrl.pathname
  
  // More comprehensive public paths
  const publicPaths = [
    '/login', 
    '/api/auth', 
    '/auth-error',
    '/404', 
    '/500',
    '/_next',
    '/favicon.ico',
    '/images',
  ]
  
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  try {
    // Check if the user is authenticated
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    })
    
    // Redirect unauthenticated users to login
    if (!token) {
      // Safely construct the redirect URL
      let redirectUrl;
      try {
        const baseUrl = req.nextUrl.origin || process.env.NEXTAUTH_URL || 'http://localhost:3000';
        redirectUrl = new URL('/login', baseUrl);
        // Only add callbackUrl if we have a valid origin
        if (req.nextUrl.origin) {
          redirectUrl.searchParams.set('callbackUrl', encodeURI(req.url));
        }
      } catch (error) {
        console.error('Error creating redirect URL:', error);
        redirectUrl = new URL('/login', 'http://localhost:3000');
      }
      
      return NextResponse.redirect(redirectUrl);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of an error, allow the request to proceed and let the application handle it
    return NextResponse.next();
  }
}

// Specify which paths middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api/auth/* (auth endpoints)
     * 2. /_next/* (Next.js internals)
     * 3. /fonts/* (static font files)
     * 4. /images/* (static image files)
     * 5. /favicon.ico, /logo.png, etc. (static files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|fonts|images).*)',
  ],
}
