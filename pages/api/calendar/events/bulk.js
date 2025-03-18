import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import dbConnect from "../../../../lib/dbConnect";
import Event from "../../../../models/Event";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Método no permitido' });
  }
  
  await dbConnect();
  const userId = session.user.id;
  
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo de eventos no vacío' });
    }
    
    // Add userId to each event
    const eventsWithUserId = events.map(event => ({
      ...event,
      userId: userId
    }));
    
    // Insert all events in one operation
    const result = await Event.insertMany(eventsWithUserId);
    
    return res.status(201).json({
      message: `${result.length} eventos creados exitosamente`,
      events: result
    });
    
  } catch (error) {
    console.error('Error creating events in bulk:', error);
    return res.status(500).json({ error: 'Error al crear eventos: ' + error.message });
  }
}
