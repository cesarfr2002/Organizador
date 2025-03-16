import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import dbConnect from "../../../../utils/dbConnect";
import Event from "../../../../models/Event";

export default async function handler(req, res) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    
    // Connect to database
    await dbConnect();
    
    // Only allow POST requests
    if (req.method === 'POST') {
      const { events } = req.body;
      
      if (!events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de eventos válido' });
      }
      
      // Prepare events with user ID
      const eventsToSave = events.map(event => ({
        ...event,
        userId: session.user.id,
        isAutoScheduled: event.isAutoScheduled || false
      }));
      
      // Insert all events
      const result = await Event.insertMany(eventsToSave);
      
      return res.status(201).json({ 
        message: 'Eventos creados correctamente',
        count: result.length,
        events: result
      });
    } else {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error adding bulk events:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
