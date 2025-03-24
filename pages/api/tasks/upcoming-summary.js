import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Set content type explicitly
    res.setHeader('Content-Type', 'application/json');
    
    // Try both auth methods
    let userId = null;
    
    // Check NextAuth session
    const session = await getServerSession(req, res, authOptions).catch(err => {
      console.log("Error getting NextAuth session:", err.message);
      return null;
    });
    
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // If no NextAuth session, check for direct login cookie
    if (!userId) {
      const sessionCookie = req.cookies?.session;
      if (sessionCookie) {
        userId = sessionCookie;
      }
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    await dbConnect();
    
    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // End of today
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Tasks due today
    const todayCount = await Task.countDocuments({
      userId: userId,
      dueDate: { $gte: today, $lte: endOfToday },
      completed: false
    });
    
    // Tasks overdue (due before today)
    const overdueCount = await Task.countDocuments({
      userId: userId,
      dueDate: { $lt: today },
      completed: false
    });
    
    return res.status(200).json({
      todayCount,
      overdueCount
    });
  } catch (error) {
    console.error('Error fetching task summary:', error);
    return res.status(500).json({ error: 'Failed to fetch task summary' });
  }
}
