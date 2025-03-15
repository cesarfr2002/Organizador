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
    // Crear una notificación de prueba
    const testNotification = await Notification.create({
      userId,
      title: 'Notificación de prueba',
      message: 'Esta es una notificación de prueba generada manualmente',
      type: 'info',
      read: false,
    });
    
    return res.status(201).json({
      message: 'Notificación de prueba creada correctamente',
      notification: testNotification
    });
  } catch (error) {
    console.error('Error al crear notificación de prueba:', error);
    return res.status(500).json({ error: 'Error al crear notificación' });
  }
}
