import { NextResponse } from 'next/server';

/**
 * Middleware function to check authentication for direct API login
 * This works alongside NextAuth but provides a simpler fallback
 */
export function withAuth(handler) {
  return async (req, res) => {
    // Check for session cookie (direct login)
    const sessionCookie = req.cookies.session;
    
    // Check for NextAuth cookie
    const nextAuthCookie = req.cookies['next-auth.session-token'];
    
    if (!sessionCookie && !nextAuthCookie) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // If we have our direct session cookie, attach user ID to request
    if (sessionCookie) {
      req.userId = sessionCookie;
    }
    
    // Continue with the handler
    return handler(req, res);
  };
}
