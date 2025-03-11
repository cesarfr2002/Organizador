import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
import Note from '../../../models/Note';
import Subject from '../../../models/Subject';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    await dbConnect();
    
    const userId = session.user.id;
    
    // Obtener todas las tareas del usuario
    const allTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({ userId, completed: true });
    const pendingTasks = allTasks - completedTasks;
    
    // Calcular tasa de completitud
    const completionRate = allTasks > 0 ? Math.round((completedTasks / allTasks) * 100) : 0;
    
    // Contar notas y asignaturas
    const totalNotes = await Note.countDocuments({ userId });
    const totalSubjects = await Subject.countDocuments({ userId });
    
    const stats = {
      totalTasks: allTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      totalNotes,
      totalSubjects
    };
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching general stats:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas generales' });
  }
}
