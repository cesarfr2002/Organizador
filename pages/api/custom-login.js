import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Enable CORS for development and production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Custom login API called');
    await dbConnect();
    const { email, password } = req.body;

    console.log('Authenticating user:', email);

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    // Find the user
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password');
      return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    }

    // Create user data to return - extremely simplified
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };

    console.log('Authentication successful');
    
    // Return success with user data - no cookies or complex operations
    return res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
}
