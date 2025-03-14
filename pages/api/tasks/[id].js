import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    await dbConnect();
    
    const { 
      query: { id, populate },
      method
    } = req;
    
    // Validar que el ID sea válido
    if (!id || id === 'undefined') {
      return res.status(400).json({ error: 'ID de tarea inválido o no proporcionado' });
    }
    
    // Validar que el ID tenga el formato correcto de MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Formato de ID inválido' });
    }
    
    const userId = session.user.id;

    switch (method) {
      // Obtener una tarea específica
      case 'GET':
        try {
          let query = Task.findOne({ _id: id, userId }).populate('subject', 'name color');
          
          // Si se solicita poblar las notas relacionadas
          if (populate === 'relatedNotes') {
            query = query.populate({
              path: 'relatedNotes',
              select: 'title subject updatedAt',
              populate: {
                path: 'subject',
                select: 'name color'
              },
              strictPopulate: false // Añadir esta opción para evitar el error mientras se actualiza el esquema
            });
          }
          
          const task = await query.exec();
          
          if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
          }
          
          return res.status(200).json(task);
        } catch (error) {
          console.error('Error retrieving task:', error);
          return res.status(500).json({ error: error.message });
        }
        
      // Actualizar una tarea
      case 'PUT':
        try {
          // Verificar si hay datos para actualizar
          if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
          }
          
          // Si se está marcando como completada, agregar la fecha de completado
          if (req.body.completed === true) {
            req.body.completedAt = new Date();
          }
          
          const task = await Task.findOneAndUpdate(
            { _id: id, userId },
            req.body,
            {
              new: true,
              runValidators: true
            }
          ).populate('subject', 'name color');
          
          if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
          }
          
          return res.status(200).json(task);
        } catch (error) {
          console.error('Error updating task:', error);
          return res.status(400).json({ error: error.message });
        }
        
      // Actualizar parcialmente una tarea (ej: marcar como completada)
      case 'PATCH':
        try {
          // Verificar si hay datos para actualizar
          if (Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron datos para actualizar' });
          }
          
          // Si se está marcando como completada, agregar la fecha de completado
          if (req.body.completed === true) {
            req.body.completedAt = new Date();
          }
          
          const task = await Task.findOneAndUpdate(
            { _id: id, userId },
            req.body,
            {
              new: true,
              runValidators: true
            }
          ).populate('subject', 'name color');
          
          if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
          }
          
          return res.status(200).json(task);
        } catch (error) {
          console.error('Error updating task partially:', error);
          return res.status(400).json({ error: error.message });
        }
        
      // Eliminar una tarea
      case 'DELETE':
        try {
          const task = await Task.findOneAndDelete({ _id: id, userId });
          
          if (!task) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
          }
          
          return res.status(200).json({ message: 'Tarea eliminada correctamente' });
        } catch (error) {
          console.error('Error deleting task:', error);
          return res.status(500).json({ error: error.message });
        }
        
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Error de servidor' });
  }
}
