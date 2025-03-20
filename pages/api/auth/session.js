import { getTokenFromCookies, verifyToken } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Get token from cookies
    const token = getTokenFromCookies(req);
    if (!token) {
      return res.status(200).json({ authenticated: false });
    }

    // Verify token
    const user = verifyToken(token);
    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    // Return session data
    res.status(200).json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Error al verificar sesión' });
  }
}
