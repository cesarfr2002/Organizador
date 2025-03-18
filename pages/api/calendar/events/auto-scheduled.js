import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import dbConnect from "../../../../lib/dbConnect";
import Event from "../../../../models/Event";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  const userId = session.user.id;
  
  try {
    // Handle DELETE request to remove all auto-scheduled events
    if (req.method === 'DELETE') {
      console.log(`Deleting auto-scheduled events for user ${userId}`);
      const result = await Event.deleteMany({
        userId: userId,
        isAutoScheduled: true
      });
      
      console.log(`Deleted ${result.deletedCount} auto-scheduled events`);
      return res.status(200).json({ 
        message: 'Eventos auto-programados eliminados correctamente',
        count: result.deletedCount 
      });
    }
    
    // Handle GET request to fetch all auto-scheduled events
    if (req.method === 'GET') {
      const autoScheduledEvents = await Event.find({
        userId: userId,
        isAutoScheduled: true
      }).populate('taskId').sort({ startTime: 1 });
      
      return res.status(200).json(autoScheduledEvents);
    }
    
    // Method not allowed
    res.setHeader('Allow', ['DELETE', 'GET']);
    return res.status(405).json({ error: 'Método no permitido' });
    
  } catch (error) {
    console.error('Error handling auto-scheduled events:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud: ' + error.message });
  }
}
