import dbConnect from '../../../lib/dbConnect';
import Task from '../../../models/Task';
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
    
    // Obtener todas las asignaturas del usuario
    const subjects = await Subject.find({ userId }).lean();
    
    // Para cada asignatura, contar tareas completadas y pendientes
    const result = await Promise.all(subjects.map(async (subject) => {
      const completed = await Task.countDocuments({ 
        userId, 
        subject: subject._id,
        completed: true 
      });
      
      const pending = await Task.countDocuments({ 
        userId, 
        subject: subject._id,
        completed: false 
      });
      
      return {
        _id: subject._id,
        name: subject.name,
        color: subject.color,
        completed,
        pending
      };
    }));
    
    // Filtrar asignaturas que no tienen tareas
    const filteredResult = result.filter(item => item.completed > 0 || item.pending > 0);
    
    return res.status(200).json(filteredResult);
  } catch (error) {
    console.error('Error fetching stats by subject:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas por asignatura' });
  }
}
