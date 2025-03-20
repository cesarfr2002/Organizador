import { connectToDatabase } from '../../../../utils/mongodb';
import { requireAuth } from '../../../../utils/auth';

async function handler(req, res) {
  // La autenticación se maneja en requireAuth
  
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('events');
    
    // Obtener eventos auto-programados para el usuario actual
    const autoScheduledEvents = await collection
      .find({ 
        userId: req.user.id,
        isAutoScheduled: true 
      })
      .toArray();
    
    return res.status(200).json(autoScheduledEvents);
  } catch (error) {
    console.error('Error al obtener eventos auto-programados:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Exportar el handler envuelto en el middleware de autenticación
export default (req, res) => requireAuth(req, res, handler);
