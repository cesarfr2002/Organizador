import { connectToDatabase } from '../../../../utils/mongodb';
import { requireAuth } from '../../../../utils/auth';
import { ObjectId } from 'mongodb';

async function handler(req, res) {
  // La autenticación se maneja en requireAuth
  
  const { method } = req;
  
  if (method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection('events');
    const { operation, eventIds } = req.body;
    
    if (!operation || !eventIds || !Array.isArray(eventIds)) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }
    
    // Convertir string IDs a ObjectIds
    const objectIds = eventIds.map(id => new ObjectId(id));
    
    // Asegurar que solo se modifican eventos del usuario actual
    const query = {
      _id: { $in: objectIds },
      userId: req.user.id
    };
    
    switch (operation) {
      case 'delete':
        const deleteResult = await collection.deleteMany(query);
        return res.status(200).json({ 
          success: true, 
          deletedCount: deleteResult.deletedCount 
        });
        
      case 'markComplete':
        const updateResult = await collection.updateMany(
          query,
          { $set: { completed: true } }
        );
        return res.status(200).json({ 
          success: true, 
          modifiedCount: updateResult.modifiedCount 
        });
        
      default:
        return res.status(400).json({ error: 'Operación no soportada' });
    }
  } catch (error) {
    console.error('Error en operación masiva de eventos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Exportar el handler envuelto en el middleware de autenticación
export default (req, res) => requireAuth(req, res, handler);
