import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { checkUpcomingTasks } from '../../../utils/taskNotifications';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  // Permitir tanto GET como POST para facilitar la verificación
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    // Detectar si se debe forzar notificaciones (ignorar el campo notificationSent)
    const forceNotify = req.query.force === 'true' || (req.body && req.body.force === true);
    
    // Si estamos forzando y reseteando, restablecer todos los campos notificationSent
    if (forceNotify && req.query.reset === 'true') {
      await dbConnect();
      const result = await Task.updateMany(
        { userId: session.user.id, completed: false },
        { $set: { notificationSent: false } }
      );
      console.log("Campo notificationSent reseteado para todas las tareas pendientes", result);
    }
    
    // Ejecutar la verificación de tareas
    const resultCheck = await checkUpcomingTasks(forceNotify);
    
    // Si no hay notificaciones pero hay tareas para hoy específicamente, intentar de nuevo
    // pero esta vez resetear el campo notificationSent primero
    if (resultCheck.tasksNotified === 0 && forceNotify) {
      console.log("No se encontraron tareas para notificar, intentando restablecer el estado de notificación");
      
      // Obtener la fecha actual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      
      await dbConnect();
      
      // Restablecer el campo notificationSent para todas las tareas de hoy
      await Task.updateMany(
        { 
          userId: session.user.id,
          completed: false,
          dueDate: {
            $gte: today,
            $lte: endOfToday
          }
        },
        { $set: { notificationSent: false } }
      );
      
      // Intentar de nuevo la verificación
      const retryResult = await checkUpcomingTasks(true);
      return res.status(200).json({
        ...retryResult,
        retried: true,
        originalResult: resultCheck
      });
    }
    
    return res.status(200).json(resultCheck);
  } catch (error) {
    console.error('Error checking upcoming tasks:', error);
    return res.status(500).json({ error: 'Error al verificar tareas próximas' });
  }
}
