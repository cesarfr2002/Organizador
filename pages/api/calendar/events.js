import { connectToDatabase } from '../../../utils/mongodb';
import { requireAuth } from '../../../utils/auth';

// Función principal del endpoint
async function handler(req, res) {
  // La autenticación se maneja en requireAuth
  
  const { method } = req;
  
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('events');
    
    switch (method) {
      case 'GET':
        // Obtener todos los eventos
        const events = await collection.find({}).toArray();
        return res.status(200).json(events);
        
      case 'POST':
        // Crear un nuevo evento
        const { title, start, end, description, allDay, color } = req.body;
        
        // Validar datos requeridos
        if (!title || !start) {
          return res.status(400).json({ error: 'Faltan campos requeridos' });
        }
        
        const newEvent = {
          title,
          start: new Date(start),
          end: end ? new Date(end) : null,
          description,
          allDay: !!allDay,
          color,
          userId: req.user.id, // Usamos el ID del usuario autenticado
          createdAt: new Date(),
        };
        
        const result = await collection.insertOne(newEvent);
        
        return res.status(201).json({
          ...newEvent,
          _id: result.insertedId,
        });
        
      default:
        return res.status(405).json({ error: 'Método no permitido' });
    }
  } catch (error) {
    console.error('Error en API de eventos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Exportar el handler envuelto en el middleware de autenticación
export default (req, res) => requireAuth(req, res, handler);
