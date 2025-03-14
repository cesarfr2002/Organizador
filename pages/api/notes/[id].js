import dbConnect from '../../../lib/dbConnect';
import Note from '../../../models/Note';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  const { method } = req;
  const { id } = req.query;
  const userId = session.user.id;
  
  // Verificar que el ID proporcionado sea válido
  if (!id || id === 'undefined') {
    return res.status(400).json({ error: 'ID de nota no válido' });
  }
  
  try {
    // Verificar que la nota exista y pertenezca al usuario
    let note = await Note.findById(id);
    
    if (!note) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    
    // Verificar que la nota pertenece al usuario autenticado
    if (note.userId.toString() !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a esta nota' });
    }
    
    switch (method) {
      case 'GET':
        // Obtener una nota específica
        note = await Note.findById(id).populate('subject', 'name color');
        return res.status(200).json(note);
        
      case 'PUT':
        // Actualizar una nota
        const updateData = {
          ...req.body,
          userId // Asegurarse de que el userId no cambie
        };
        
        note = await Note.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true
        }).populate('subject', 'name color');
        
        return res.status(200).json(note);
        
      case 'DELETE':
        // Eliminar una nota
        await Note.findByIdAndDelete(id);
        return res.status(200).json({ success: true, message: 'Nota eliminada correctamente' });
        
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling note:', error);
    return res.status(500).json({ error: 'Error del servidor al procesar la nota' });
  }
}
