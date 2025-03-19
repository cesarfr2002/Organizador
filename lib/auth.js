import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || '57dd7df0034aacd3fec020a220930081d9d3e9318b54c082b55cad978f57c064';
const TOKEN_NAME = 'authToken';
const MAX_AGE = 60 * 60 * 24 * 7; // 1 week

export function createToken(user) {
  // Create a JWT token with user info
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name || user.email
    },
    JWT_SECRET,
    { expiresIn: MAX_AGE }
  );
  
  return token;
}

export function setTokenCookie(res, token) {
  const cookie = serialize(TOKEN_NAME, token, {
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

export function removeTokenCookie(res) {
  const cookie = serialize(TOKEN_NAME, '', {
    maxAge: -1,
    path: '/',
  });
  
  res.setHeader('Set-Cookie', cookie);
}

export function parseCookies(req) {
  // For API Routes
  if (req.cookies) return req.cookies;
  
  // For middleware
  const cookie = req.headers?.cookie;
  return parse(cookie || '');
}

export function getTokenFromCookies(req) {
  const cookies = parseCookies(req);
  return cookies[TOKEN_NAME];
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
