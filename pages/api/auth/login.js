import { compare } from 'bcryptjs';
import { connectToDatabase } from '../../../lib/db';
import { serialize } from 'cookie';
import { sign } from 'jsonwebtoken';

export default async function handler(req, res) {
  // Solo permitir POST para login
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Conectar a la base de datos
    const { db } = await connectToDatabase();
    
    // Buscar usuario
    const user = await db.collection('users').findOne({ email });
    
    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Crear token JWT
    const token = sign(
      { 
        id: user._id.toString(),
        email: user.email,
        name: user.name || 'Usuario'
      },
      process.env.NEXTAUTH_SECRET || 'mi-secreto-fallback',
      { expiresIn: '7d' }
    );
    
    // Configurar cookie
    const cookie = serialize('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/'
    });
    
    // Establecer cookie
    res.setHeader('Set-Cookie', cookie);
    
    // Devolver datos del usuario (sin la contraseña)
    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name || 'Usuario'
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}
