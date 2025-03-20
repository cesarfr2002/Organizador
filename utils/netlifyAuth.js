import jwt from 'jsonwebtoken';

// Function to validate Netlify Identity JWT tokens in API routes
export const validateNetlifyToken = (token) => {
  try {
    // In a real implementation, you would verify the signature using Netlify's JWKS
    // This is a simplified version that just decodes the token
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.sub) {
      return null;
    }
    
    return {
      id: decoded.sub,
      email: decoded.email,
      user_metadata: decoded.user_metadata || {}
    };
  } catch (error) {
    console.error('Error validating Netlify token:', error);
    return null;
  }
};
