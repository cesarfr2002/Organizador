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
    
    // Only allow DELETE requests
    if (req.method === 'DELETE') {
      // Delete all auto-scheduled events for the user
      const deleteResult = await Event.deleteMany({ 
        userId: session.user.id,
        isAutoScheduled: true
      });
      
      return res.status(200).json({ 
        message: 'Eventos auto-programados eliminados correctamente',
        count: deleteResult.deletedCount 
      });
    } else {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling auto-scheduled events:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
}
