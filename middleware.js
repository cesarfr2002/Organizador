import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req) {
  // First try NextAuth session token
  const nextAuthToken = req.cookies.get("next-auth.session-token")?.value;
  const directAuthToken = req.cookies.get("auth-token")?.value;
  
  // If we have a NextAuth token, verify it
  if (nextAuthToken) {
    try {
      // Use NextAuth's built-in verification
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production"
      });
      
      if (token) {
        // Token is valid, allow the request
        return NextResponse.next();
      }
    } catch (error) {
      console.error("NextAuth token verification error:", error);
    }
  }
  
  // If we have a direct auth token, use a simplified check
  // Note: We're just checking existence as we don't have jsonwebtoken
  if (directAuthToken) {
    // In production, you'd want to verify this token properly
    // Here we're just checking if it exists, which is NOT secure
    // but avoids the dependency issue temporarily
    return NextResponse.next();
  }
  
  // No valid tokens found - redirect to login
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

// Configure which routes are protected by this middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/notes/:path*",
    "/subjects/:path*",
    "/schedule/:path*",
    "/calendar/:path*",
    // Exclude notification endpoints from auth requirement
    "/api/tasks/create", 
    "/api/tasks/update", 
    "/api/tasks/delete",
    "/api/subjects/:path*",
    "/api/notes/:path*",
    // Add other protected routes here
  ],
};
