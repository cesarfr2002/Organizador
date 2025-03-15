import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Notification from '../../../models/notification';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  const userId = session.user.id;
  
  await dbConnect();
  
  try {
    // Crear una notificación de prueba sin necesidad de POST
    const testNotification = await Notification.create({
      userId,
      title: '✅ Notificación de prueba simple',
      message: 'Esta es una notificación de prueba que puedes acceder directamente por URL',
      type: 'info',
      read: false,
    });
    
    return res.status(201).json({
      success: true,
      message: 'Notificación de prueba creada correctamente. Revisa el icono de la campana.',
      notification: testNotification
    });
  } catch (error) {
    console.error('Error al crear notificación de prueba:', error);
    return res.status(500).json({ error: 'Error al crear notificación' });
  }
}
