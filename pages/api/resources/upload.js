import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import formidable from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { compressPDF } from '../../../utils/fileCompression';

// Deshabilitar el analizador de cuerpo predeterminado
export const config = {
  api: {
    bodyParser: false,
  },
};

// Función para comprimir imágenes
async function compressImage(filePath, outputPath) {
  try {
    // Comprimir imagen con sharp, reduciendo calidad y redimensionando si es muy grande
    await sharp(filePath)
      .resize(1200, 1200, { 
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80, progressive: true })
      .toFile(outputPath);
    
    // Eliminar archivo original
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    return false;
  }
}

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
    // Crear directorios de uploads si no existen
    const resourcesDir = path.join(process.cwd(), 'public', 'resources');
    if (!fs.existsSync(resourcesDir)) {
      fs.mkdirSync(resourcesDir, { recursive: true });
    }

    // Configurar formidable para parsear el archivo
    const form = formidable({
      uploadDir: resourcesDir,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024, // Limitar a 20MB
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

    // Obtener el archivo subido
    const resourceFile = files.file;
    if (!resourceFile) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    // Definir ruta y nombre del archivo
    const originalPath = resourceFile.filepath;
    const fileExtension = path.extname(resourceFile.originalFilename).toLowerCase();
    const fileType = resourceFile.mimetype || '';
    const fileName = path.basename(originalPath);
    const compressedPath = path.join(resourcesDir, `compressed_${fileName}`);

    // Procesar archivo según su tipo
    let finalPath = originalPath;
    let compressSuccess = false;
    let fileSize = resourceFile.size;
    
    // Comprimir según el tipo de archivo
    if (fileType.startsWith('image/')) {
      // Comprimir imagen
      compressSuccess = await compressImage(originalPath, compressedPath);
      if (compressSuccess) {
        finalPath = compressedPath;
        // Actualizar tamaño del archivo comprimido
        const stats = fs.statSync(compressedPath);
        fileSize = stats.size;
      }
    } else if (fileType === 'application/pdf') {
      // Comprimir PDF (implementa esta función en utils/fileCompression.js)
      const result = await compressPDF(originalPath, compressedPath);
      if (result.success) {
        finalPath = compressedPath;
        fileSize = result.size;
        compressSuccess = true;
      }
    }
    // Para otros tipos de archivo, podríamos aplicar compresión zip u otra técnica

    // Construir la URL relativa para el recurso
    const relativePath = finalPath.split('public')[1];
    const resourceUrl = relativePath.replace(/\\/g, '/');

    // Calcular porcentaje de compresión
    let compressionRate = 0;
    if (compressSuccess && resourceFile.size > 0) {
      compressionRate = Math.round((1 - (fileSize / resourceFile.size)) * 100);
    }

    return res.status(200).json({
      message: 'Recurso subido correctamente',
      resourceUrl,
      originalName: resourceFile.originalFilename,
      fileType,
      fileSize,
      compressionRate,
      wasCompressed: compressSuccess
    });
  } catch (error) {
    console.error('Error uploading resource:', error);
    return res.status(500).json({ error: 'Error al subir el recurso' });
  }
}
