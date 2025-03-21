import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Note from '../../../models/Note';
import Notification from '../../../models/notification';
import { createTaskNotification } from '../../../utils/notificationService';
import { withApiAuth } from '../middleware';

// Your task handler function
async function tasksHandler(req, res) {
  const { method } = req;
  
  switch (method) {
    case 'GET':
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
    
    // Add other methods (POST, PUT, DELETE) as needed
    
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// Wrap the handler with our authentication middleware
export default withApiAuth(tasksHandler);
