import { serialize } from 'cookie';

export default function handler(req, res) {
  // Limpiar la cookie estableciendo una vacía con expiración inmediata
  const cookie = serialize('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });
  
  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
