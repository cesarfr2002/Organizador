import { verify } from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  try {
    // Verificar que existe una cookie
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.authToken;
    
    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    // Verificar token
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || 'mi-secreto-fallback');
    
    // Devolver información del usuario
    return res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    return res.status(401).json({ error: 'No autenticado' });
  }
}
