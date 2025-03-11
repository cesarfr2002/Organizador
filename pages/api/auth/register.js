import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { hash } from 'bcryptjs';


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    await dbConnect();

    const { name, email, password } = req.body;

    // Validación básica
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }

    // Crear usuario
    const hashedPassword = await hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Eliminar la contraseña antes de devolver el usuario
    const newUser = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
}
