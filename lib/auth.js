import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const TOKEN_NAME = 'uorganizer_auth_token';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Create JWT token
export function createToken(user) {
  const token = jwt.sign(
    {
      id: user.id || user._id.toString(),
      name: user.name,
      email: user.email,
    },
    SECRET,
    { expiresIn: MAX_AGE }
  );
  return token;
}

// Verify JWT token
export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}

// Set a cookie with the token
export function setAuthCookie(res, token) {
  const cookie = serialize(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE,
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

// Clear the auth cookie
export function clearAuthCookie(res) {
  const cookie = serialize(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

// Get token from cookies
export function getTokenFromCookies(req) {
  // Check if we have cookies
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  return cookies[TOKEN_NAME];
}

// Get user from token
export function getUserFromToken(token) {
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}
