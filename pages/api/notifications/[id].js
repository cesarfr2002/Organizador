import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Notification from '../../../models/notification';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  const { id } = req.query;
  const userId = session.user.id;
  
  await dbConnect();
  
  // Verificar que la notificación exista y pertenezca al usuario
  const notification = await Notification.findOne({ _id: id, userId });
  
  if (!notification) {
    return res.status(404).json({ error: 'Notificación no encontrada' });
  }
  
  switch (req.method) {
    // PATCH: Marcar como leída/no leída
    case 'PATCH':
      try {
        const { read } = req.body;
        
        if (typeof read !== 'boolean') {
          return res.status(400).json({ error: 'El campo "read" debe ser un booleano' });
        }
        
        notification.read = read;
        await notification.save();
        
        return res.status(200).json(notification);
      } catch (error) {
        console.error('Error updating notification:', error);
        return res.status(500).json({ error: 'Error al actualizar la notificación' });
      }
    
    // DELETE: Eliminar una notificación
    case 'DELETE':
      try {
        await Notification.deleteOne({ _id: id, userId });
        return res.status(200).json({ message: 'Notificación eliminada' });
      } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Error al eliminar la notificación' });
      }
      
    default:
      res.setHeader('Allow', ['PATCH', 'DELETE']);
      return res.status(405).json({ error: 'Método no permitido' });
  }
}
