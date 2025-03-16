import dbConnect from '../../../../lib/dbConnect';
import NoteRevision from '../../../../models/NoteRevision';
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
  
  // GET: Obtener historial de revisiones de una nota
  if (req.method === 'GET') {
    try {
      // Verificar que la nota pertenece al usuario
      const note = await Note.findOne({ _id: id, userId: session.user.id });
      
      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }
      
      const revisions = await NoteRevision.find({ 
        noteId: id,
        userId: session.user.id
      }).sort({ timestamp: -1 });
      
      const formattedRevisions = revisions.map(rev => ({
        id: rev._id,
        timestamp: rev.timestamp,
        changes: rev.changes || ['Cambios realizados en esta revisión']
      }));
      
      return res.status(200).json(formattedRevisions);
    } catch (error) {
      console.error('Error fetching note revisions:', error);
      return res.status(500).json({ error: 'Error al obtener el historial de revisiones' });
    }
  }
  
  // POST: Crear una nueva revisión
  else if (req.method === 'POST') {
    try {
      const { content, title, changes } = req.body;
      
      // Verificar que la nota pertenece al usuario
      const note = await Note.findOne({ _id: id, userId: session.user.id });
      
      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }
      
      // Crear una nueva revisión
      const revision = new NoteRevision({
        noteId: id,
        userId: session.user.id,
        title,
        content,
        timestamp: new Date(),
        changes: changes || ['Revisión guardada']
      });
      
      await revision.save();
      
      return res.status(201).json({ 
        message: 'Revisión guardada correctamente',
        revisionId: revision._id 
      });
    } catch (error) {
      console.error('Error creating note revision:', error);
      return res.status(500).json({ error: 'Error al crear una nueva revisión' });
    }
  }
  
  // Método no permitido
  return res.status(405).json({ error: 'Método no permitido' });
}
