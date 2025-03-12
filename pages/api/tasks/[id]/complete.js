import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/dbConnect';
import Task from '../../../../models/Task';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { id } = req.query;
  
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid task ID' });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    await dbConnect();
    
    // Buscar la tarea y verificar que pertenezca al usuario actual
    const task = await Task.findOne({ 
      _id: id,
      userId: session.user.id
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }
    
    // Marcar como completada y establecer la fecha de finalización
    task.completed = true;
    task.completedAt = new Date();
    await task.save();
    
    return res.status(200).json({ success: true, task });
  } catch (error) {
    console.error('Error completing task:', error);
    return res.status(500).json({ error: 'Failed to complete task' });
  }
}
