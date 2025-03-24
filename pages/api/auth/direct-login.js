import { sign } from 'jsonwebtoken';
import { serialize } from 'cookie';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    // Create JWT payload
    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    };
    
    // Sign the JWT
    const token = sign(
      payload,
      process.env.NEXTAUTH_SECRET,
      { expiresIn: '30d' }
    );
    
    // Set cookie
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });
    
    res.setHeader('Set-Cookie', cookie);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error, please try again later' 
    });
  }
}
