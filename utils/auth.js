// Utilidad para verificar el token JWT de Netlify Identity
const verifyNetlifyIdentityToken = async (req) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    // Extraer el token
    const token = authHeader.split(' ')[1];
    
    // En un entorno real se verificaría el token de forma más segura
    // Para simplificar, solo verificamos que existe
    if (!token) {
      return null;
    }
    
    // Simulamos obtener la información del usuario a partir del token
    // En producción, deberías decodificar y verificar el token JWT
    return {
      id: 'user-id',
      email: 'user@example.com',
      // Otros datos del usuario según sea necesario
    };
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return null;
  }
};

// Middleware para verificar autenticación en rutas API
const requireAuth = async (req, res, handler) => {
  const user = await verifyNetlifyIdentityToken(req);
  
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  
  // Agregar el usuario al objeto request
  req.user = user;
  
  // Continuar con el manejador de la ruta
  return handler(req, res);
};

export { verifyNetlifyIdentityToken, requireAuth };
