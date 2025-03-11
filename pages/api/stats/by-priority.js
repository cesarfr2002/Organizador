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
    
    const userId = session.user.id;
    
    // Contar tareas por prioridad
    const highPriority = await Task.countDocuments({ userId, priority: 1 });
    const mediumPriority = await Task.countDocuments({ userId, priority: 2 });
    const lowPriority = await Task.countDocuments({ userId, priority: 3 });
    
    const result = [
      { priority: 'Alta', count: highPriority },
      { priority: 'Media', count: mediumPriority },
      { priority: 'Baja', count: lowPriority }
    ];
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching stats by priority:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas por prioridad' });
  }
}
