import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    await dbConnect();
    
    // Obtener todas las tareas pendientes
    const pendingTasks = await Task.find({
      userId: session.user.id,
      completed: false
    })
    .populate('subject', 'name color')
    .sort({ dueDate: 1 });
    
    return res.status(200).json(pendingTasks);
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
}
