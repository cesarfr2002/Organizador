import dbConnect from '../../../../lib/dbConnect';
import Resource from '../../../../models/Resource';
import Subject from '../../../../models/Subject';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(req, res) {
  const { id } = req.query; // id de la asignatura
  
  // Verificar autenticación
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  // Verificar que el usuario tiene acceso a esta asignatura
  const subjectExists = await Subject.exists({
    _id: id,
    userId: session.user.id
  });
  
  if (!subjectExists) {
    return res.status(404).json({ error: 'Asignatura no encontrada' });
  }
  
  // POST - Crear un nuevo recurso para la asignatura
  if (req.method === 'POST') {
    try {
      const { 
        title, 
        description, 
        type, 
        url, 
        tags, 
        important, 
        fileUrl, 
        fileName,
        fileSize
      } = req.body;
      
      // Validar campos obligatorios
      if (!title) {
        return res.status(400).json({ error: 'El título es obligatorio' });
      }
      
      if (!url) {
        return res.status(400).json({ error: 'La URL es obligatoria' });
      }
      
      // Crear el recurso
      const resource = await Resource.create({
        title,
        description,
        type,
        url,
        tags: tags || [],
        important: important || false,
        subject: id,
        userId: session.user.id,
        // Agregar campos de archivo si existen
        ...(fileUrl && { fileUrl }),
        ...(fileName && { fileName }),
        ...(fileSize && { fileSize })
      });
      
      res.status(201).json(resource);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ error: 'Error al crear el recurso' });
    }
  }
  
  // GET - Obtener todos los recursos de la asignatura
  else if (req.method === 'GET') {
    try {
      const resources = await Resource.find({
        subject: id,
        userId: session.user.id
      }).sort({ createdAt: -1 });
      
      res.status(200).json(resources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Error al obtener los recursos' });
    }
  }
  
  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
