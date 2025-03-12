import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';

export default async function handler(req, res) {
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
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error retrieving tasks:', error);
      res.status(500).json({ message: 'Error al obtener las tareas' });
    }
  } 
  // POST: Crear una nueva tarea
  else if (req.method === 'POST') {
    try {
      // Extraer datos del cuerpo de la solicitud
      const { title, subject, dueDate, priority, description, type } = req.body;
      
      // Validar datos requeridos
      if (!title) {
        return res.status(400).json({ message: 'El título es obligatorio' });
      }
      
      // Crear la tarea con el ID de usuario de la sesión
      const task = new Task({
        title,
        subject: subject || null,
        dueDate: dueDate || null,
        priority: priority || 2,
        description: description || '',
        type: type || 'tarea',
        completed: false,
        userId: session.user.id // Asegurar que se use el ID de usuario de la sesión
      });
      
      // Guardar en la base de datos
      await task.save();
      
      // Responder con la tarea creada
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Error al crear la tarea' });
    }
  } else {
    // Método no permitido
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}
