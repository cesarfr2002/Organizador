import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import dbConnect from '../../../../../lib/dbConnect';
import Resource from '../../../../../models/Resource';
import Subject from '../../../../../models/Subject';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query; // ID de la materia
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de materia inválido' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  await dbConnect();
  
  // Verificar que la materia existe y pertenece al usuario
  const subject = await Subject.findOne({
    _id: id,
    userId: session.user.id
  });
  
  if (!subject) {
    return res.status(404).json({ error: 'Materia no encontrada o acceso denegado' });
  }
  
  // GET: Obtener recursos de la materia
  if (req.method === 'GET') {
    try {
      const resources = await Resource.find({
        subject: id,
        userId: session.user.id
      }).sort({ important: -1, createdAt: -1 });
      
      return res.status(200).json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      return res.status(500).json({ error: 'Error al obtener los recursos' });
    }
  }
  
  // POST: Crear un nuevo recurso
  else if (req.method === 'POST') {
    try {
      const { title, description, type, url, tags = [], important = false } = req.body;
      
      if (!title || !url) {
        return res.status(400).json({ error: 'Título y URL son obligatorios' });
      }
      
      const isExternalLink = url.startsWith('http://') || url.startsWith('https://');
      
      const resource = await Resource.create({
        subject: id,
        userId: session.user.id,
        title,
        description,
        type,
        url,
        isExternalLink,
        tags,
        important
      });
      
      return res.status(201).json(resource);
    } catch (error) {
      console.error('Error creating resource:', error);
      return res.status(500).json({ error: 'Error al crear el recurso' });
    }
  } 
  
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
