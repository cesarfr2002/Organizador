import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    // Find the user
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    }

    // Create user data to return
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };

    // Set a simple session cookie that doesn't require jsonwebtoken
    res.setHeader('Set-Cookie', `auth_session=${Buffer.from(JSON.stringify(userData)).toString('base64')}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''} Max-Age=${60 * 60 * 24 * 30}`);

    // Return success with user data
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
}
