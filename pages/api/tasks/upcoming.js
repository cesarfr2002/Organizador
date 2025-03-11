import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    await dbConnect();
    
    // Obtener tareas pendientes y ordenadas por fecha
    const tasks = await Task.find({ 
      userId: session.user.id,
      completed: false,
      dueDate: { $gte: new Date() }
    })
    .populate('subject', 'name color')
    .sort({ dueDate: 1 })
    .limit(5); // Limitar a 5 tareas próximas
    
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching upcoming tasks:', error);
    return res.status(500).json({ error: 'Error al obtener las tareas' });
  }
}
