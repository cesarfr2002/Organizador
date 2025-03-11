import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  const { 
    query: { id },
    method
  } = req;
  
  const userId = session.user.id;

  switch (method) {
    // Obtener una tarea específica
    case 'GET':
      try {
        const task = await Task.findOne({ _id: id, userId }).populate('subject', 'name color');
        
        if (!task) {
          return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.status(200).json(task);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Actualizar una tarea
    case 'PUT':
      try {
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
        
        res.status(200).json(task);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    // Actualizar parcialmente una tarea (ej: marcar como completada)
    case 'PATCH':
      try {
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
        
        res.status(200).json(task);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    // Eliminar una tarea
    case 'DELETE':
      try {
        const task = await Task.findOneAndDelete({ _id: id, userId });
        
        if (!task) {
          return res.status(404).json({ error: 'Tarea no encontrada' });
        }
        
        res.status(200).json({ message: 'Tarea eliminada correctamente' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
