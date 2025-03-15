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
  const userId = session.user.id;
  
  try {
    // Fecha actual (hoy a medianoche)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Fin del día de hoy
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Tareas con fecha límite de hoy
    const todayTasks = await Task.find({
      userId,
      dueDate: {
        $gte: today,
        $lte: endOfToday
      },
      completed: false
    }).lean();
    
    // Fecha de mañana
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    // Tareas con fecha límite de mañana
    const tomorrowTasks = await Task.find({
      userId,
      dueDate: {
        $gt: endOfToday,
        $lte: endOfTomorrow
      },
      completed: false
    }).lean();
    
    // Tareas atrasadas (vencidas)
    const overdueTasks = await Task.find({
      userId,
      dueDate: { $lt: today },
      completed: false
    }).lean();
    
    // Para tareas próximas (3 días)
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    // Tareas próximas (hoy + 3 días)
    const upcomingTasks = await Task.find({
      userId,
      dueDate: {
        $gte: today,
        $lt: threeDaysLater
      },
      completed: false
    }).lean();
    
    // Enriquecer las tareas con información de depuración
    const enrichTask = (task) => {
      const dueDate = new Date(task.dueDate);
      return {
        ...task,
        _debugInfo: {
          dateString: dueDate.toString(),
          dateISO: dueDate.toISOString(),
          dateLocal: dueDate.toLocaleString(),
          todayString: today.toString(),
          isToday: dueDate.toDateString() === today.toDateString(),
          isSameDay: dueDate.getDate() === today.getDate() && 
                    dueDate.getMonth() === today.getMonth() && 
                    dueDate.getFullYear() === today.getFullYear(),
          taskTimestamp: dueDate.getTime(),
          todayTimestamp: today.getTime(),
          timeDiff: dueDate.getTime() - today.getTime(),
          timeDiffDays: Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }
      };
    };
    
    return res.status(200).json({
      now: new Date().toISOString(),
      todayStart: today.toISOString(),
      todayEnd: endOfToday.toISOString(),
      tomorrowStart: tomorrow.toISOString(),
      tomorrowEnd: endOfTomorrow.toISOString(),
      threeDaysLater: threeDaysLater.toISOString(),
      countSummary: {
        todayTasks: todayTasks.length,
        tomorrowTasks: tomorrowTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingTasks: upcomingTasks.length,
      },
      tasks: {
        today: todayTasks.map(enrichTask),
        tomorrow: tomorrowTasks.map(enrichTask),
        overdue: overdueTasks.map(enrichTask),
        upcoming: upcomingTasks.map(enrichTask)
      }
    });
  } catch (error) {
    console.error('Error al depurar tareas y fechas:', error);
    return res.status(500).json({ error: 'Error al depurar tareas' });
  }
}
