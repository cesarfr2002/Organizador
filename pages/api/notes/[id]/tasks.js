import dbConnect from '../../../../lib/dbConnect';
import Task from '../../../../models/Task';
import Note from '../../../../models/Note';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const { id } = req.query; // ID de la nota
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // GET: Obtener tareas relacionadas a una nota
  if (req.method === 'GET') {
    try {
      // Buscar la nota para verificar que pertenece al usuario
      const note = await Note.findOne({ _id: id, userId: session.user.id });
      
      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }
      
      // Obtener tareas relacionadas a esta nota
      const tasks = await Task.find({ 
        userId: session.user.id,
        relatedNotes: id 
      }).populate('subject').sort({ dueDate: 1 });
      
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching related tasks:', error);
      return res.status(500).json({ error: 'Error al obtener las tareas relacionadas' });
    }
  }
  
  // Método no permitido
  return res.status(405).json({ error: 'Método no permitido' });
}
