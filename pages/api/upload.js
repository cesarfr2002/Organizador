import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Configurar para que Next.js no analice el cuerpo de la petición
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Verificar autenticación
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Configurar formidable para parsear el archivo
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      filename: (name, ext, part) => {
        return `${Date.now()}_${uuidv4()}${ext}`;
      }
    });

    // Procesar el formulario
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Obtener el archivo de imagen
    const imageFile = files.image;
    if (!imageFile) {
      return res.status(400).json({ error: 'No se ha proporcionado una imagen' });
    }

    // Construir la URL relativa para la imagen
    const relativePath = imageFile.filepath.split('public')[1];
    const imageUrl = relativePath.replace(/\\/g, '/');

    return res.status(200).json({
      message: 'Imagen subida correctamente',
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Error al subir la imagen' });
  }
}
