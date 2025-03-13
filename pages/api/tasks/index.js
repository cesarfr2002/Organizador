import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

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
        const tasks = await Task.find({ userId: session.user.id })
          .populate('subject', 'name color')
          .sort({ dueDate: 1 });
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
