import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/dbConnect';
import Task from '../../../../models/Task';
import Subject from '../../../../models/Subject';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query; // ID de la materia
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de materia inválido' });
  }
  
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    await dbConnect();
    
    // Verificar que la materia existe y pertenece al usuario
    const subject = await Subject.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!subject) {
      return res.status(404).json({ error: 'Materia no encontrada o acceso denegado' });
    }
    
    // Obtener el tipo de filtro de los query parameters
    const { filter = 'all' } = req.query;
    
    // Construir la consulta base
    const query = {
      subject: id,
      userId: session.user.id
    };
    
    // Aplicar filtros adicionales si es necesario
    if (filter === 'pending') {
      query.completed = false;
    } else if (filter === 'completed') {
      query.completed = true;
    }
    
    // Obtener las tareas y ordenarlas
    const tasks = await Task.find(query)
      .sort({ 
        completed: 1, // No completadas primero
        dueDate: 1, // Ordenar por fecha de vencimiento ascendente (más cercanas primero)
        priority: -1, // Mayor prioridad primero
        createdAt: -1 // Más recientes primero
      });
    
    return res.status(200).json(tasks);
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Error al obtener tareas' });
  }
}
