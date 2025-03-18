import { getSession } from 'next-auth/react';
import dbConnect from '../../../utils/dbConnect';
import User from '../../../models/User';

export default async function handler(req, res) {
  // Only allow PUT method
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    await dbConnect();
    
    // Find user by email from session
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Update user settings
    // If settings field doesn't exist, create it
    if (!user.settings) {
      user.settings = {};
    }
    
    // Update settings with values from request body
    const { theme, language, notificationsEnabled, emailNotifications } = req.body;
    
    // Only update fields that are provided in the request
    if (theme !== undefined) user.settings.theme = theme;
    if (language !== undefined) user.settings.language = language;
    if (notificationsEnabled !== undefined) user.settings.notificationsEnabled = notificationsEnabled;
    if (emailNotifications !== undefined) user.settings.emailNotifications = emailNotifications;
    
    await user.save();
    
    return res.status(200).json({ message: 'Configuración actualizada correctamente' });
    
  } catch (error) {
    console.error('Error updating user settings:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}
