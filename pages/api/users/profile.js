import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { getSession } from 'next-auth/react';
import { hash, compare } from 'bcryptjs';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  await dbConnect();
  
  const { method } = req;
  const userId = session.user.id;
  
  switch (method) {
    // Obtener datos del perfil del usuario
    case 'GET':
      try {
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.status(200).json(user);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    // Actualizar perfil de usuario
    case 'PUT':
      try {
        const { name, email, currentPassword, newPassword } = req.body;
        
        // Buscar el usuario actual
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Si se proporciona una contraseña actual y nueva, actualizar la contraseña
        if (currentPassword && newPassword) {
          // Verificar que la contraseña actual sea correcta
          const isPasswordValid = await compare(currentPassword, user.password);
          
          if (!isPasswordValid) {
            return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
          }
          
          // Validar la nueva contraseña
          if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
          }
          
          // Hashear la nueva contraseña
          user.password = await hash(newPassword, 12);
        }
        
        // Actualizar nombre y email si se proporcionan
        if (name) user.name = name;
        if (email) user.email = email;
        
        // Guardar cambios
        await user.save();
        
        // Devolver usuario sin la contraseña
        const updatedUser = {
          id: user._id,
          name: user.name,
          email: user.email,
        };
        
        res.status(200).json(updatedUser);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
