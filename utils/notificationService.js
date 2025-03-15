/**
 * Servicio para manejar la creación de notificaciones desde cualquier parte de la aplicación
 */

// Crear una nueva notificación para un usuario
export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  relatedItemId = null,
  relatedItemModel = null,
  link = null,
  icon = null,
  isSystemNotification = false
}) {
  console.log('createNotification called with:', { userId, title, message, type });
  
  // Validación de entrada
  if (!userId) {
    console.error('Error: userId is required for notifications');
    throw new Error('userId es requerido para crear notificaciones');
  }
  
  if (!title || !message) {
    console.error('Error: title and message are required for notifications');
    throw new Error('Título y mensaje son requeridos para crear notificaciones');
  }
  
  try {
    console.log('Sending notification request to API...');
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        message,
        type,
        relatedItemId,
        relatedItemModel,
        link,
        icon,
        isSystemNotification,
      }),
    });

    console.log('Notification API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notification API error:', errorData);
      throw new Error(errorData.error || 'Error al crear notificación');
    }

    const result = await response.json();
    console.log('Notification created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Helpers para crear tipos específicos de notificaciones

export async function createTaskNotification(userId, task) {
  console.log('Creating task notification for userId:', userId, 'task:', task);
  
  // Verificar que el userId y el task sean válidos
  if (!userId || !task || !task._id || !task.title) {
    console.error('Invalid parameters for task notification:', { userId, task });
    throw new Error('Parámetros inválidos para crear notificación de tarea');
  }
  
  return createNotification({
    userId,
    title: 'Nueva tarea',
    message: `Se ha creado una nueva tarea: ${task.title}`,
    type: 'task',
    relatedItemId: task._id,
    relatedItemModel: 'Task',
    icon: 'check-circle',
  });
}

export async function createDeadlineNotification(userId, task) {
  console.log('Creating deadline notification for userId:', userId, 'task:', task.title);
  
  // Verificar que el userId y el task sean válidos
  if (!userId || !task || !task._id || !task.title) {
    console.error('Invalid parameters for deadline notification:', { userId, task });
    throw new Error('Parámetros inválidos para crear notificación de fecha límite');
  }
  
  // Manejar mejor la detección de la fecha de vencimiento
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  // Normalizar las fechas a medianoche para comparación más precisa
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);
  
  // Calcular diferencia en días
  const diffTime = dueDay - today;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  console.log('Días hasta vencimiento:', diffDays);
  
  let message, title;
  if (diffDays <= 0) {
    title = '⚠️ Tarea vence hoy';
    message = `¡IMPORTANTE! La tarea "${task.title}" vence hoy`;
  } else if (diffDays === 1) {
    title = 'Tarea vence mañana';
    message = `La tarea "${task.title}" vence mañana`;
  } else {
    title = 'Recordatorio de tarea';
    message = `La tarea "${task.title}" vence en ${diffDays} días`;
  }
  
  return createNotification({
    userId,
    title,
    message,
    type: 'warning',
    relatedItemId: task._id,
    relatedItemModel: 'Task',
    icon: 'clock',
  });
}

export async function createEventNotification(userId, event) {
  return createNotification({
    userId,
    title: 'Nuevo evento',
    message: `Evento próximo: ${event.title}`,
    type: 'event',
    relatedItemId: event._id,
    relatedItemModel: 'Event',
    icon: 'calendar',
  });
}

export async function createAchievementNotification(userId, achievement) {
  return createNotification({
    userId,
    title: '¡Felicitaciones!',
    message: achievement,
    type: 'achievement',
    icon: 'academic-cap',
    isSystemNotification: true,
  });
}
