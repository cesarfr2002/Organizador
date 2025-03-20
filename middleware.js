import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const path = req.nextUrl.pathname
  console.log('Middleware running for path:', path);
  console.log('Env vars in middleware - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('Env vars in middleware - NODE_ENV:', process.env.NODE_ENV);
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth', '/404', '/500']
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
  if (isPublicPath) {
    console.log('Public path detected, allowing access');
    return NextResponse.next()
  }
  
  // Check if the user is authenticated
  console.log('Checking authentication token...');
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    })
    
    console.log('Token exists:', !!token);
    
    // Redirect unauthenticated users to login
    if (!token) {
      console.log('No token found, redirecting to login');
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', encodeURI(req.url))
      console.log('Redirecting to:', url.toString());
      return NextResponse.redirect(url)
    }
    
    console.log('User is authenticated, proceeding');
    return NextResponse.next()
  } catch (error) {
    console.error('Error in middleware authentication:', error);
    // Redirect to login on error
    const url = new URL('/login', req.url)
    return NextResponse.redirect(url)
  }
}

// Specify which paths middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
