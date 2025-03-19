import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req) {
  const path = req.nextUrl.pathname
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth', '/404', '/500']
  const isPublicPath = publicPaths.some(publicPath => 
    path === publicPath || path.startsWith(`${publicPath}/`)
  )
  
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
    const url = new URL('/login', req.url)
    url.searchParams.set('callbackUrl', encodeURI(req.url))
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

// Specify which paths middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}
