import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import dbConnect from '../../lib/dbConnect';

export default async function handler(req, res) {
  // Set proper content type to ensure JSON parsing works
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', events: [] });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated', events: [] });
    }
    
    await dbConnect();
    
    // Always ensure we return a proper structure even if empty
    return res.status(200).json({
      events: [],
      totalCount: 0
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch events', 
      message: error.message,
      events: [] // Always include empty array to prevent filter errors
    });
  }
}
