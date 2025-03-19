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
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { db } = await connectToDatabase();
    const { _id } = decoded;
    
    // Handle string ID vs ObjectId
    const userId = typeof _id === 'string' ? new ObjectId(_id) : _id;
    
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } } // Exclude password
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
