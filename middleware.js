import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const path = req.nextUrl.pathname
  
  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api/auth', 
    '/404', 
    '/500', 
    '/manifest.json',
    '/favicon.ico',
    '/sw.js',
  ]
  
  // Is this a public path or static resource?
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
  // Allow access to static files and API routes
  if (
    path.includes('/_next/') || 
    path.includes('/static/') ||
    path.endsWith('.png') ||
    path.endsWith('.ico') ||
    path.endsWith('.json') ||
    path.endsWith('.js') ||
    path.endsWith('.css') ||
    path.startsWith('/api/')
  ) {
    return NextResponse.next()
  }
  
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  try {
    // Check if user is authenticated
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    })
    
    // If not authenticated, redirect to login
    if (!token) {
      const url = new URL('/login', req.url)
      url.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(url)
    }
    
    // If authenticated, continue
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)
    // Fail safe - redirect to login if there's an error
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.json$|.*\\.js$).*)',
  ],
}
