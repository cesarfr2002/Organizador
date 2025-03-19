import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Set a timeout for the function
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Login timeout')), 8000)
  );

  try {
    console.log('Custom login API called');
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
    }

    // Race between DB operation and timeout
    await Promise.race([
      dbConnect(),
      timeoutPromise
    ]);

    console.log('DB connected, finding user:', email);
    
    // Simplified user query - just get minimal fields needed
    const user = await User.findOne(
      { email }, 
      { _id: 1, name: 1, email: 1, password: 1 }
    ).lean().exec();
    
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

    // Create minimal user data to return
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };

    console.log('Authentication successful');
    
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
