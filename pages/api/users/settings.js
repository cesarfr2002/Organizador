import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { getSession } from 'next-auth/react';

// Modelo para guardar configuración (se podría crear un modelo separado)
const DEFAULT_SETTINGS = {
  theme: 'light',
  notificationsEnabled: true,
  emailNotifications: false,
  language: 'es'
};

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  const { method } = req;
  const userId = session.user.id;
  
  switch (method) {
    // Obtener configuración del usuario
    case 'GET':
      try {
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Si el usuario no tiene configuración, devolver valores por defecto
        const settings = user.settings || DEFAULT_SETTINGS;
        
        res.status(200).json(settings);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Actualizar configuración del usuario
    case 'PUT':
      try {
        const settings = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Actualizar configuración
        user.settings = {
          ...DEFAULT_SETTINGS, // Mantener valores por defecto para campos no proporcionados
          ...settings // Sobrescribir con los valores proporcionados
        };
        
        await user.save();
        
        res.status(200).json(user.settings);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
