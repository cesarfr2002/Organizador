import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

/**
 * Comprime un archivo PDF
 * @param {string} inputPath Ruta al archivo original
 * @param {string} outputPath Ruta donde guardar el archivo comprimido
 * @returns {Promise<{success: boolean, size: number}>} Resultado de la compresión
 */
export async function compressPDF(inputPath, outputPath) {
  try {
    // Leer el archivo PDF original
    const pdfBytes = fs.readFileSync(inputPath);
    
    // Cargar el documento
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Opciones de compresión
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true, // Usar streams de objetos para reducir tamaño
      addDefaultPage: false,
    });
    
    // Guardar el PDF comprimido
    fs.writeFileSync(outputPath, compressedBytes);
    
    // Verificar tamaño resultante
    const stats = fs.statSync(outputPath);
    
    // Eliminar archivo original
    fs.unlinkSync(inputPath);
    
    return {
      success: true,
      size: stats.size
    };
  } catch (error) {
    console.error('Error comprimiendo PDF:', error);
    return {
      success: false,
      size: 0
    };
  }
}

/**
 * Determina si vale la pena comprimir un archivo basado en su tamaño y tipo
 * @param {string} fileType Tipo MIME del archivo
 * @param {number} fileSize Tamaño del archivo en bytes
 * @returns {boolean} True si se debería comprimir
 */
export function shouldCompress(fileType, fileSize) {
  // Siempre comprimir imágenes y PDFs
  if (fileType.startsWith('image/') || fileType === 'application/pdf') {
    return true;
  }
  
  // Comprimir archivos grandes de ciertos tipos
  if (fileSize > 5 * 1024 * 1024) { // Más de 5MB
    const compressibleTypes = [
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    return compressibleTypes.includes(fileType);
  }
  
  return false;
}
