import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Note from '../../../models/Note'; // Importar modelo de notas

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
        // Extraer datos del cuerpo de la solicitud
        const { title, subject, dueDate, priority, description, type } = req.body;
        
        // Log for debugging
        console.log('Received task data:', req.body);
        
        // Validar datos requeridos
        if (!title) {
          return res.status(400).json({ message: 'El título es obligatorio' });
        }
        
        // No need to convert priority - accept string values directly
        // Validate the priority value is one of the acceptable enum values
        if (!['Alta', 'Media', 'Baja'].includes(priority)) {
          console.warn('Invalid priority value, defaulting to Media:', priority);
        }
        
        // Crear la tarea con el ID de usuario de la sesión
        const task = new Task({
          title,
          subject: subject || null,
          dueDate: dueDate || null,
          priority: priority || 'Media', // Use string value directly
          description: description || '',
          type: type || 'tarea',
          completed: false,
          userId: session.user.id 
        });
        
        // Guardar en la base de datos
        await task.save();
        
        // Responder con la tarea creada
        return res.status(201).json(task);
      } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ message: 'Error al crear la tarea', details: error.message });
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
