import dbConnect from '../../../lib/dbConnect';
import SharedNote from '../../../models/SharedNote';
import Note from '../../../models/Note';
import User from '../../../models/User';

export default async function handler(req, res) {
  const { code } = req.query;
  
  await dbConnect();
  
  // GET: Obtener una nota compartida por código
  if (req.method === 'GET') {
    try {
      // Buscar el enlace compartido
      const sharedNote = await SharedNote.findOne({ 
        shareCode: code,
        expiresAt: { $gt: new Date() } // Que no esté expirado
      });
      
      if (!sharedNote) {
        return res.status(404).json({ error: 'Enlace no encontrado o expirado' });
      }
      
      // Obtener la nota
      const note = await Note.findById(sharedNote.noteId).populate('subject');
      
      if (!note) {
        return res.status(404).json({ error: 'La nota ya no existe' });
      }
      
      // Obtener información del autor
      const user = await User.findById(sharedNote.userId, 'name email');
      
      // Formatear la respuesta para ocultar información sensible
      const formattedNote = {
        title: note.title,
        content: note.content,
        tags: note.tags,
        subject: note.subject ? {
          name: note.subject.name,
          color: note.subject.color
        } : null,
        updatedAt: note.updatedAt,
        authorName: user ? user.name : null
      };
      
      return res.status(200).json({ 
        note: formattedNote,
        expiresAt: sharedNote.expiresAt
      });
    } catch (error) {
      console.error('Error fetching shared note:', error);
      return res.status(500).json({ error: 'Error al obtener la nota compartida' });
    }
  }
  
  // Método no permitido
  return res.status(405).json({ error: 'Método no permitido' });
}
