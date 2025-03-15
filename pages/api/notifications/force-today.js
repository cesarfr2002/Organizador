import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Notification from '../../../models/notification';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  await dbConnect();
  const userId = session.user.id;
  
  try {
    // 1. Obtener todas las tareas de hoy y próximos 3 días
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999);
    
    // Buscar tareas para HOY y los próximos 3 días
    const upcomingTasks = await Task.find({
      userId: userId,
      dueDate: {
        $gte: today,
        $lte: threeDaysLater
      },
      completed: false
    });
    
    console.log(`Encontradas ${upcomingTasks.length} tareas próximas (0-3 días)`);
    
    if (upcomingTasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay tareas próximas que requieran notificación',
        count: 0
      });
    }
    
    // 2. Generar notificaciones para cada tarea
    const notifications = [];
    
    for (const task of upcomingTasks) {
      try {
        // Calcular días restantes para personalizar el mensaje
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const timeDiff = dueDate.getTime() - today.getTime();
        const diffDays = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        
        let title, message;
        
        if (diffDays === 0) {
          // Vence hoy
          title = '⚠️ Tarea vence hoy';
          message = `La tarea "${task.title}" vence hoy. ¡No olvides completarla!`;
        } else if (diffDays === 1) {
          // Vence mañana
          title = '🔔 Tarea vence mañana';
          message = `La tarea "${task.title}" vence mañana. Prepárate para completarla.`;
        } else {
          // Vence en X días
          title = `📅 Tarea próxima a vencer`;
          message = `La tarea "${task.title}" vence en ${diffDays} días.`;
        }
        
        // Crear notificación
        const notification = await Notification.create({
          userId: userId,
          title: title,
          message: message,
          type: 'warning',
          relatedItemId: task._id,
          relatedItemModel: 'Task',
          read: false,
          icon: 'clock'
        });
        
        notifications.push(notification);
        
        // Marcar tarea como notificada
        task.notificationSent = true;
        await task.save();
        
        console.log(`Notificación creada para tarea: ${task.title} (vence en ${diffDays} días)`);
      } catch (error) {
        console.error(`Error creando notificación para tarea ${task._id}:`, error);
      }
    }
    
    // 3. Agrupar notificaciones por día para el mensaje de respuesta
    const today_count = notifications.filter(n => n.title.includes('hoy')).length;
    const tomorrow_count = notifications.filter(n => n.title.includes('mañana')).length;
    const future_count = notifications.filter(n => n.title.includes('próxima')).length;
    
    const message = `Notificaciones generadas: ${today_count} para hoy, ${tomorrow_count} para mañana, ${future_count} para días siguientes`;
    
    return res.status(200).json({
      success: true,
      message: message,
      count: notifications.length,
      summary: {
        today: today_count,
        tomorrow: tomorrow_count,
        future: future_count
      },
      notifications: notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message
      }))
    });
    
  } catch (error) {
    console.error('Error forcing notifications:', error);
    return res.status(500).json({ error: 'Error al forzar notificaciones' });
  }
}
