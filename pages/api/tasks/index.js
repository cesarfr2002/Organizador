import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Note from '../../../models/Note';
import Notification from '../../../models/notification';
import { createTaskNotification } from '../../../utils/notificationService';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Verificar autenticación
    if (!session) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    await dbConnect();

    // GET: Recuperar tareas
    if (req.method === 'GET') {
      try {
        let query = { userId: session.user.id };
        
        // Filtrar por estado (completadas/pendientes)
        if (req.query.status === 'completed') {
          query.completed = true;
        } else if (req.query.status === 'pending') {
          query.completed = false;
        }
        
        // Filtrar por asignatura
        if (req.query.subject && req.query.subject !== 'all') {
          query.subject = req.query.subject;
        }
        
        // Filtrar por prioridad
        if (req.query.priority && req.query.priority !== 'all') {
          query.priority = req.query.priority;
        }
        
        // Filtrar por nota relacionada - Buscar de forma inversa
        let tasks;
        if (req.query.noteId) {
          // Primero busca la nota para obtener las tareas relacionadas
          const note = await Note.findById(req.query.noteId);
          if (note && note.relatedTasks && note.relatedTasks.length > 0) {
            // Luego busca las tareas usando esos IDs
            query._id = { $in: note.relatedTasks };
            tasks = await Task.find(query)
              .populate('subject', 'name color')
              .sort({ dueDate: 1 });
          } else {
            // Si la nota no existe o no tiene tareas vinculadas, devolver array vacío
            tasks = [];
          }
        } else {
          // Consulta normal sin filtro de notas
          tasks = await Task.find(query)
            .populate('subject', 'name color')
            .sort({ dueDate: 1 });
        }
        
        return res.status(200).json(tasks);
      } catch (error) {
        console.error('Error retrieving tasks:', error);
        return res.status(500).json({ message: 'Error al obtener las tareas' });
      }
    } 
    // POST: Crear una nueva tarea
    else if (req.method === 'POST') {
      try {
        console.log('Creando nueva tarea:', req.body);
        
        // Crear la tarea
        const task = await Task.create({
          ...req.body,
          userId: session.user.id
        });
        
        console.log('Tarea creada con ID:', task._id);
        
        // Crear notificación para la nueva tarea - Manejo de errores mejorado
        try {
          console.log('Intentando crear notificación para tarea:', task._id);
          const notification = await createTaskNotification(session.user.id, task);
          console.log('Notificación creada exitosamente:', notification);
        } catch (notificationError) {
          console.error('Error al crear notificación para tarea:', task._id, notificationError);
          
          // Intento de crear notificación manualmente como respaldo
          try {
            const backupNotification = await Notification.create({
              userId: session.user.id,
              title: 'Nueva tarea',
              message: `Se ha creado una nueva tarea: ${task.title}`,
              type: 'task',
              relatedItemId: task._id,
              relatedItemModel: 'Task',
            });
            console.log('Notificación de respaldo creada:', backupNotification);
          } catch (backupError) {
            console.error('Error en notificación de respaldo:', backupError);
          }
        }
        
        return res.status(201).json(task);
      } catch (error) {
        console.error('Error creating task:', error);
        return res.status(400).json({ error: error.message });
      }
    } else {
      // Método no permitido
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ message: 'Error de servidor' });
  }
}
