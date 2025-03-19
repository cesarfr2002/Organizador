import { getTokenFromCookies, verifyToken } from '../../../lib/auth';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getTokenFromCookies(req);
    
    if (!token) {
      // Not authenticated but not an error
      return res.status(200).json({ user: null });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      // Invalid token but not an error
      return res.status(200).json({ user: null });
    }
    
    const { db } = await connectToDatabase();
    const { _id } = decoded;
    
    // Handle string ID vs ObjectId
    const userId = typeof _id === 'string' ? new ObjectId(_id) : _id;
    
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.status(200).json({ user: null });
    }
    
    // Return a format compatible with what NextAuth would return
    return res.status(200).json({
      user: {
        id: user._id.toString(),
        name: user.name || user.email,
        email: user.email,
        image: user.image || null
      },
      expires: new Date(decoded.exp * 1000).toISOString()
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return res.status(200).json({ user: null });
  }
}
