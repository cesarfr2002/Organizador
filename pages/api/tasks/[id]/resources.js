import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/dbConnect';
import Task from '../../../../models/Task';
import Resource from '../../../../models/Resource';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query; // ID de la tarea
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // Verificar que el ID sea válido
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de tarea inválido' });
  }
  
  // Comprobar que la tarea existe y pertenece al usuario
  const task = await Task.findOne({
    _id: id,
    userId: session.user.id
  });
  
  if (!task) {
    return res.status(404).json({ error: 'Tarea no encontrada o acceso denegado' });
  }

  // GET: Obtener recursos vinculados a la tarea
  if (req.method === 'GET') {
    try {
      // Buscar recursos que tienen esta tarea en su array relatedTasks
      const resources = await Resource.find({
        userId: session.user.id,
        relatedTasks: id
      }).sort({ createdAt: -1 });
      
      return res.status(200).json(resources);
    } catch (error) {
      console.error('Error fetching related resources:', error);
      return res.status(500).json({ error: 'Error al obtener recursos relacionados' });
    }
  }
  
  // POST: Vincular/desvincular recursos con esta tarea
  if (req.method === 'POST') {
    try {
      const { resourceIds, operation } = req.body;
      
      if (!resourceIds || !Array.isArray(resourceIds) || !operation) {
        return res.status(400).json({ error: 'Parámetros inválidos' });
      }
      
      if (operation === 'link') {
        // Vincular recursos a la tarea
        await Resource.updateMany(
          { 
            _id: { $in: resourceIds }, 
            userId: session.user.id 
          },
          { $addToSet: { relatedTasks: id } }
        );
        
        return res.status(200).json({ success: true, message: 'Recursos vinculados correctamente' });
      } else if (operation === 'unlink') {
        // Desvincular recursos de la tarea
        await Resource.updateMany(
          { 
            _id: { $in: resourceIds }, 
            userId: session.user.id 
          },
          { $pull: { relatedTasks: id } }
        );
        
        return res.status(200).json({ success: true, message: 'Recursos desvinculados correctamente' });
      } else {
        return res.status(400).json({ error: 'Operación no válida' });
      }
    } catch (error) {
      console.error('Error updating resource relationships:', error);
      return res.status(500).json({ error: 'Error al actualizar relaciones entre recursos y tarea' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
