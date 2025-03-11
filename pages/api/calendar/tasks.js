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
    
    // Obtener tareas del usuario para el mes actual y el siguiente
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes actual
    const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Último día del próximo mes
    
    const tasks = await Task.find({
      userId: session.user.id,
      dueDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('subject', 'name color');
    
    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    return res.status(500).json({ error: 'Error al obtener las tareas para el calendario' });
  }
}
