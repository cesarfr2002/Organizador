import dbConnect from '../../../../lib/dbConnect';
import Note from '../../../../models/Note';
import SharedNote from '../../../../models/SharedNote';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { nanoid } from 'nanoid';

export default async function handler(req, res) {
  const { id } = req.query; // ID de la nota
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // POST: Crear un enlace de compartición temporal
  if (req.method === 'POST') {
    try {
      // Verificar que la nota pertenece al usuario
      const note = await Note.findOne({ _id: id, userId: session.user.id });
      
      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }
      
      // Generar un código único para compartir
      const shareCode = nanoid(10);
      
      // Crear o actualizar el registro de compartición
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Válido por 7 días
      
      // Comprobar si ya existe un enlace compartido para esta nota
      let sharedNote = await SharedNote.findOne({ noteId: id });
      
      if (sharedNote) {
        // Actualizar la fecha de expiración y el código
        sharedNote.expiresAt = expirationDate;
        sharedNote.shareCode = shareCode;
        await sharedNote.save();
      } else {
        // Crear nuevo registro
        sharedNote = new SharedNote({
          noteId: id,
          userId: session.user.id,
          shareCode,
          expiresAt: expirationDate
        });
        await sharedNote.save();
      }
      
      // Construir URL para compartir (asumiendo que la aplicación está en localhost:3000)
      const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/shared/${shareCode}`;
      
      return res.status(200).json({ 
        shareUrl,
        expiresAt: expirationDate
      });
    } catch (error) {
      console.error('Error sharing note:', error);
      return res.status(500).json({ error: 'Error al compartir la nota' });
    }
  }
  
  // DELETE: Eliminar un enlace compartido
  else if (req.method === 'DELETE') {
    try {
      // Verificar que la nota pertenece al usuario
      const note = await Note.findOne({ _id: id, userId: session.user.id });
      
      if (!note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }
      
      // Eliminar el enlace compartido
      await SharedNote.deleteOne({ noteId: id });
      
      return res.status(200).json({ message: 'Enlace compartido eliminado' });
    } catch (error) {
      console.error('Error removing shared link:', error);
      return res.status(500).json({ error: 'Error al eliminar el enlace compartido' });
    }
  }
  
  // Método no permitido
  return res.status(405).json({ error: 'Método no permitido' });
}
