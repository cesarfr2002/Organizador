import { connectToDatabase } from '../../../utils/mongodb';
import { requireAuth } from '../../../utils/auth';

async function handler(req, res) {
  // La autenticación se maneja en requireAuth
  
  const { method } = req;
  
  if (method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const { db } = await connectToDatabase();
    const eventsCollection = db.collection('events');
    
    // Obtener fecha actual y establecer límites
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    
    // Eventos de hoy
    const todayEvents = await eventsCollection
      .find({
        userId: req.user.id,
        start: { $gte: startOfDay, $lte: endOfDay }
      })
      .sort({ start: 1 })
      .limit(5)
      .toArray();
    
    // Próximos eventos
    const upcomingEvents = await eventsCollection
      .find({
        userId: req.user.id,
        start: { $gt: endOfDay, $lte: endOfWeek }
      })
      .sort({ start: 1 })
      .limit(5)
      .toArray();
    
    return res.status(200).json({
      today: todayEvents,
      upcoming: upcomingEvents
    });
  } catch (error) {
    console.error('Error al obtener eventos del dashboard:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Exportar el handler envuelto en el middleware de autenticación
export default (req, res) => requireAuth(req, res, handler);
