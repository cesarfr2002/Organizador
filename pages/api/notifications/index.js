import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Notification from '../../../models/notification';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  const userId = session.user.id;
  
  switch (req.method) {
    // GET: Obtener notificaciones del usuario
    case 'GET':
      try {
        const { limit = 10, skip = 0, unreadOnly = false } = req.query;
        
        const query = { userId };
        if (unreadOnly === 'true') {
          query.read = false;
        }
        
        const notifications = await Notification.find(query)
          .sort({ createdAt: -1 })
          .skip(parseInt(skip))
          .limit(parseInt(limit));
        
        // Obtener también el conteo de notificaciones no leídas
        const unreadCount = await Notification.countDocuments({
          userId,
          read: false
        });
        
        return res.status(200).json({
          notifications,
          unreadCount,
          hasMore: notifications.length === parseInt(limit)
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Error al obtener notificaciones' });
      }
      
    // POST: Crear una nueva notificación
    case 'POST':
      try {
        const notification = await Notification.create({
          ...req.body,
          userId
        });
        
        return res.status(201).json(notification);
      } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(400).json({ error: error.message });
      }
    
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Método no permitido' });
  }
}
