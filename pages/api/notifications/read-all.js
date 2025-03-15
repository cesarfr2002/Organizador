import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Notification from '../../../models/notification';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  const userId = session.user.id;
  
  await dbConnect();
  
  try {
    await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    
    return res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ error: 'Error al marcar notificaciones como leídas' });
  }
}
