import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '../../../../lib/dbConnect';
import Resource from '../../../../models/Resource';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  const { id } = req.query; // ID del recurso
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'ID de recurso inválido' });
  }
  
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  await dbConnect();
  
  try {
    const resource = await Resource.findOne({
      _id: id,
      userId: session.user.id
    });
    
    if (!resource) {
      return res.status(404).json({ error: 'Recurso no encontrado o acceso denegado' });
    }
    
    // Incrementar contador de accesos y actualizar la fecha de último acceso
    resource.accessCount += 1;
    resource.lastAccessed = new Date();
    await resource.save();
    
    return res.status(200).json({ success: true, accessCount: resource.accessCount });
  } catch (error) {
    console.error('Error recording resource access:', error);
    return res.status(500).json({ error: 'Error al registrar acceso al recurso' });
  }
}
