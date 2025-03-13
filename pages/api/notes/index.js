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
  const userId = session.user.id;
  
  switch (method) {
    // Obtener todas las notas del usuario con filtros opcionales y ordenación
    case 'GET':
      try {
        let query = { userId };
        
        // Filtrar por asignatura
        if (req.query.subject && req.query.subject !== 'all') {
          query.subject = req.query.subject;
        }
        
        // Filtrar por etiqueta
        if (req.query.tag) {
          query.tags = req.query.tag;
        }
        
        // Buscar por texto (en título y contenido)
        if (req.query.search) {
          const searchRegex = new RegExp(req.query.search, 'i');
          query.$or = [
            { title: searchRegex },
            { content: searchRegex }
          ];
        }
        
        // Ordenación
        let sort = {};
        const sortField = req.query.sort || 'updatedAt';
        const sortOrder = req.query.order === 'asc' ? 1 : -1;
        sort[sortField] = sortOrder;
        
        const notes = await Note.find(query)
          .populate('subject', 'name color')
          .sort(sort);
        
        res.status(200).json(notes);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Crear una nueva nota
    case 'POST':
      try {
        const note = await Note.create({
          ...req.body,
          userId
        });
        
        res.status(201).json(note);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
