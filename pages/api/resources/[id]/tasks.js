import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/dbConnect';
import Resource from '../../../../models/Resource';
import Task from '../../../../models/Task';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query; // ID del recurso
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // Validar el ID del recurso
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de recurso inválido' });
  }
  
  // Verificar que el recurso existe y pertenece al usuario
  const resource = await Resource.findOne({
    _id: id,
    userId: session.user.id
  });
  
  if (!resource) {
    return res.status(404).json({ error: 'Recurso no encontrado o acceso denegado' });
  }
  
  // GET: Obtener tareas vinculadas a este recurso
  if (req.method === 'GET') {
    try {
      // Si el recurso tiene tareas relacionadas
      if (resource.relatedTasks && resource.relatedTasks.length > 0) {
        // Buscar esas tareas
        const tasks = await Task.find({
          _id: { $in: resource.relatedTasks },
          userId: session.user.id
        }).populate('subject', 'name color').sort({ dueDate: 1 });
        
        return res.status(200).json(tasks);
      } else {
        return res.status(200).json([]);
      }
    } catch (error) {
      console.error('Error fetching related tasks:', error);
      return res.status(500).json({ error: 'Error al obtener tareas relacionadas' });
    }
  }
  
  // PUT: Actualizar tareas vinculadas al recurso
  if (req.method === 'PUT') {
    try {
      const { taskIds } = req.body;
      
      if (!Array.isArray(taskIds)) {
        return res.status(400).json({ error: 'taskIds debe ser un array' });
      }
      
      // Validar que todas las tareas existan y pertenezcan al usuario
      if (taskIds.length > 0) {
        const validTasks = await Task.countDocuments({
          _id: { $in: taskIds },
          userId: session.user.id
        });
        
        if (validTasks !== taskIds.length) {
          return res.status(400).json({ error: 'Una o más tareas no existen o no pertenecen a este usuario' });
        }
      }
      
      // Actualizar el recurso con las tareas relacionadas
      resource.relatedTasks = taskIds;
      await resource.save();
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error updating related tasks:', error);
      return res.status(500).json({ error: 'Error al actualizar tareas relacionadas' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
