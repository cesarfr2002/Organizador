import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  await dbConnect();
  
  try {
    const userId = session.user.id;
    
    // Obtener fecha actual (hoy)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fin de hoy
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Contar tareas para hoy
    const todayCount = await Task.countDocuments({
      userId,
      dueDate: {
        $gte: today,
        $lte: endOfDay
      },
      completed: false
    });
    
    // Contar tareas atrasadas
    const overdueCount = await Task.countDocuments({
      userId,
      dueDate: { $lt: today },
      completed: false
    });
    
    // Contar próximas (1-7 días)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingCount = await Task.countDocuments({
      userId,
      dueDate: {
        $gt: endOfDay,
        $lte: nextWeek
      },
      completed: false
    });
    
    return res.status(200).json({
      todayCount,
      overdueCount,
      upcomingCount,
      total: todayCount + overdueCount + upcomingCount
    });
  } catch (error) {
    console.error('Error getting tasks summary:', error);
    return res.status(500).json({ error: 'Error al obtener resumen de tareas' });
  }
}
