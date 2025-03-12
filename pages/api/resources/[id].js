import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/dbConnect';
import Resource from '../../../models/Resource';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { id } = req.query; // ID del recurso
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de recurso inválido' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  await dbConnect();
  
  // Verificar que el recurso existe y pertenece al usuario
  const resource = await Resource.findOne({
    _id: id,
    userId: session.user.id
  });
  
  if (!resource) {
    return res.status(404).json({ error: 'Recurso no encontrado o acceso denegado' });
  }
  
  // GET: Obtener un recurso específico
  if (req.method === 'GET') {
    return res.status(200).json(resource);
  }
  
  // PUT/PATCH: Actualizar un recurso
  else if (req.method === 'PUT' || req.method === 'PATCH') {
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
      
      // Si es un PATCH para incrementar el contador de accesos
      if (req.method === 'PATCH' && !req.body.title && !req.body.description) {
        resource.accessCount = (resource.accessCount || 0) + 1;
        resource.lastAccessed = new Date();
        await resource.save();
        return res.status(200).json({ 
          success: true, 
          accessCount: resource.accessCount,
          lastAccessed: resource.lastAccessed
        });
      }
      
      // Actualización normal de campos
      if (title) resource.title = title;
      if (description !== undefined) resource.description = description;
      if (type) resource.type = type;
      if (url) {
        resource.url = url;
        resource.isExternalLink = url.startsWith('http://') || url.startsWith('https://');
      }
      if (tags) resource.tags = tags;
      if (important !== undefined) resource.important = important;
      
      // Actualizar campos de archivo si existen
      if (fileUrl !== undefined) resource.fileUrl = fileUrl;
      if (fileName !== undefined) resource.fileName = fileName;
      if (fileSize !== undefined) resource.fileSize = fileSize;
      
      await resource.save();
      return res.status(200).json(resource);
    } catch (error) {
      console.error('Error updating resource:', error);
      return res.status(500).json({ error: 'Error al actualizar el recurso' });
    }
  }
  
  // DELETE: Eliminar un recurso
  else if (req.method === 'DELETE') {
    try {
      // Si el recurso tiene un archivo asociado, eliminarlo del sistema de archivos
      if (resource.fileUrl) {
        try {
          const filePath = path.join(process.cwd(), 'public', resource.fileUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
          // Continuar con la eliminación del recurso aunque no se pueda eliminar el archivo
        }
      }
      
      await Resource.deleteOne({ _id: id });
      return res.status(200).json({ message: 'Recurso eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting resource:', error);
      return res.status(500).json({ error: 'Error al eliminar el recurso' });
    }
  } 
  
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
