import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Por favor defina la variable de entorno MONGODB_URI dentro de .env.local'
  );
}

/**
 * Global es utilizado aquí para mantener la conexión
 * a la base de datos durante hot reloading de desarrollo
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Tiempo de espera para seleccionar servidor
      connectTimeoutMS: 10000, // Tiempo de espera para conectar
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Conexión a MongoDB establecida');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Error conectando a MongoDB:', e.message);
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
