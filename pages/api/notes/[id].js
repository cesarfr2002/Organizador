import dbConnect from '../../../lib/dbConnect';
import Note from '../../../models/Note';
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  const { 
    query: { id },
    method
  } = req;
  
  const userId = session.user.id;

  switch (method) {
    // Obtener una nota específica
    case 'GET':
      try {
        const note = await Note.findOne({ _id: id, userId }).populate('subject', 'name color');
        
        if (!note) {
          return res.status(404).json({ error: 'Nota no encontrada' });
        }
        
        res.status(200).json(note);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Actualizar una nota
    case 'PUT':
      try {
        const note = await Note.findOneAndUpdate(
          { _id: id, userId },
          req.body,
          {
            new: true,
            runValidators: true
          }
        ).populate('subject', 'name color');
        
        if (!note) {
          return res.status(404).json({ error: 'Nota no encontrada' });
        }
        
        res.status(200).json(note);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    // Eliminar una nota
    case 'DELETE':
      try {
        const note = await Note.findOneAndDelete({ _id: id, userId });
        
        if (!note) {
          return res.status(404).json({ error: 'Nota no encontrada' });
        }
        
        res.status(200).json({ message: 'Nota eliminada correctamente' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
