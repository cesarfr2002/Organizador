import dbConnect from '../lib/dbConnect';
import Task from '../models/Task';
import { createDeadlineNotification } from './notificationService';

/**
 * Verifica tareas próximas a vencer y genera notificaciones
 * @param {boolean} forceNotify - Si es true, notifica incluso tareas que ya tienen notificationSent=true
 */
export async function checkUpcomingTasks(forceNotify = false) {
  await dbConnect();
  
  // Mejoramos la normalización horaria para considera zona horaria Colombia
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Fecha límite - 3 días después
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 3);
  
  console.log(`Verificando tareas entre ${today.toISOString()} y ${endDate.toISOString()}`);
  console.log(`Forzar notificaciones: ${forceNotify}`);
  
  try {
    // IMPORTANTE: Intentar siempre primero con tareas de hoy
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Construir query especial para tareas de hoy
    const todayQuery = {
      dueDate: {
        $gte: today,
        $lte: todayEnd
      },
      completed: false
    };
    
    // Si no estamos forzando notificaciones, filtrar por las que no tienen notificación enviada
    if (!forceNotify) {
      todayQuery.$or = [
        { notificationSent: false },
        { notificationSent: { $exists: false } }
      ];
    }
    
    // Obtener tareas para hoy
    const todayTasks = await Task.find(todayQuery);
    
    console.log(`DEPURACIÓN: Encontradas ${todayTasks.length} tareas para HOY EXACTAMENTE`);
    todayTasks.forEach(task => {
      console.log(`- TAREA HOY: "${task.title}", Fecha: ${new Date(task.dueDate).toLocaleString()}, notificationSent: ${task.notificationSent}`);
    });
    
    // Si encontramos tareas para hoy, procesarlas
    if (todayTasks.length > 0) {
      console.log("Procesando notificaciones para tareas de hoy");
      return await processNotifications(todayTasks);
    }
    
    // Si no hay tareas para hoy específicamente, buscar tareas próximas
    let query = {
      dueDate: {
        $gte: today,
        $lt: endDate
      },
      completed: false,
    };
    
    // Solo filtrar por notificationSent si no estamos forzando notificaciones
    if (!forceNotify) {
      query.$or = [
        { notificationSent: false },
        { notificationSent: { $exists: false } }
      ];
    }
    
    // Obtener tareas próximas
    const upcomingTasks = await Task.find(query);
    console.log(`Se encontraron ${upcomingTasks.length} tareas próximas a vencer`);
    
    // En caso de forzar, resetear el estado de notificationSent
    if (forceNotify && upcomingTasks.length > 0) {
      console.log("Forzando notificaciones - ignorando estado notificationSent");
      
      // Marcar todas las tareas encontradas como no notificadas para este ciclo
      for (const task of upcomingTasks) {
        task.notificationSent = false;
      }
    }
    
    return processNotifications(upcomingTasks);
  } catch (error) {
    console.error('Error al verificar tareas próximas:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función auxiliar para procesar las notificaciones
async function processNotifications(tasks) {
  const notificaciones = [];
  
  // Generar notificaciones para cada tarea
  for (const task of tasks) {
    try {
      console.log(`Generando notificación para: ${task.title}`);
      
      const notification = await createDeadlineNotification(task.userId, task);
      notificaciones.push(notification);
      
      // Marcar que ya se envió notificación para esta tarea
      task.notificationSent = true;
      await task.save();
      
      console.log(`✅ Notificación creada exitosamente para tarea ${task._id}`);
    } catch (err) {
      console.error(`❌ Error al crear notificación para tarea ${task._id}:`, err);
    }
  }
  
  return {
    success: true,
    tasksNotified: notificaciones.length,
    notifications: notificaciones
  };
}

/**
 * Verifica si una tarea debe generar notificación al ser creada
 * @param {Object} task - La tarea recién creada
 * @returns {boolean} - True si la tarea debe generar notificación
 */
export function shouldNotifyOnCreate(task) {
  // Si la tarea vence hoy o mañana, notificar inmediatamente
  if (!task.dueDate) return false;
  
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Si la fecha de vencimiento es hoy o mañana
  return (
    dueDate.getDate() === now.getDate() && 
    dueDate.getMonth() === now.getMonth() && 
    dueDate.getFullYear() === now.getFullYear()
  ) || (
    dueDate.getDate() === tomorrow.getDate() && 
    dueDate.getMonth() === tomorrow.getMonth() && 
    dueDate.getFullYear() === tomorrow.getFullYear()
  );
}
