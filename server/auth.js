import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const TOKEN_NAME = 'uorganizer_auth_token';
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'supersecretkey';

export function getSessionFromRequest(req) {
  try {
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const token = cookies[TOKEN_NAME];
    
    if (!token) {
      return null;
    }
    
    const userData = jwt.verify(token, JWT_SECRET);
    return {
      user: userData
    };
  } catch (error) {
    console.error('Auth error:', error.message);
    return null;
  }
}
