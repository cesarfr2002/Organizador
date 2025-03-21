// API authentication middleware
export function withApiAuth(handler) {
  return async (req, res) => {
    // Check for session cookie
    const cookies = req.headers.cookie || '';
    const hasUserSession = cookies.includes('user_session=');
    
    // If in development or has a session, allow access
    if (process.env.NODE_ENV === 'development' || hasUserSession) {
      return handler(req, res);
    }
    
    // Otherwise, return 401 Unauthorized
    return res.status(401).json({ error: 'Unauthorized access' });
  };
}
