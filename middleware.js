import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const path = req.nextUrl.pathname
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth', '/404', '/500', '/manifest.json']
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
  // Also allow access to static files
  if (path.includes('/_next/') || path.includes('/favicon.ico') || path.includes('.png')) {
    return NextResponse.next()
  }
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Check if the user is authenticated
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  })
  
  // Redirect unauthenticated users to login
  if (!token) {
    // Use a valid URL construction to avoid errors
    const loginUrl = new URL('/login', req.url)
    
    // Make sure the URL is valid before setting search params
    try {
      // Only set callback URL if it's a valid URL
      if (req.url) {
        loginUrl.searchParams.set('callbackUrl', req.url)
      }
      return NextResponse.redirect(loginUrl)
    } catch (error) {
      // Fallback if there's an issue with URL construction
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  return NextResponse.next()
}

// Specify which paths middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
