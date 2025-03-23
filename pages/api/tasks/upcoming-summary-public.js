import { getToken } from 'next-auth/jwt';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

export default async function handler(req, res) {
  console.log("===== API ENDPOINT ENVIRONMENT CHECK =====");
  console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing");
  console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing");
  console.log("Request path:", req.url);
  console.log("Request method:", req.method);
  console.log("Request headers:", JSON.stringify(req.headers));
  console.log("=========================================");

  // Set CORS headers to allow frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get the token directly instead of using getServerSession
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      // Return an empty response rather than an error
      return res.status(200).json({
        todayCount: 0,
        overdueCount: 0
      });
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
      userId: token.id,
      dueDate: { $gte: today, $lte: endOfToday },
      completed: false
    });
    
    // Tasks overdue (due before today)
    const overdueCount = await Task.countDocuments({
      userId: token.id,
      dueDate: { $lt: today },
      completed: false
    });
    
    // Set content type explicitly
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      todayCount,
      overdueCount
    });
  } catch (error) {
    console.error('Error fetching task summary:', error);
    // Set content type explicitly
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ 
      error: 'Failed to fetch task summary',
      todayCount: 0,
      overdueCount: 0
    });
  }
}
