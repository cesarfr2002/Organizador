import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Log MongoDB connection information
console.log("===== DATABASE CONNECTION ENVIRONMENT CHECK =====");
console.log("MONGODB_URI:", MONGODB_URI ? "✅ Set (length: " + MONGODB_URI.length + ")" : "❌ Missing");
console.log("MONGODB_URI starts with:", MONGODB_URI ? MONGODB_URI.substring(0, 20) + "..." : "N/A");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("=================================================");

if (!MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Please define the MONGODB_URI environment variable');
  } else {
    console.error('Please define the MONGODB_URI environment variable');
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise && MONGODB_URI) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  } else if (!MONGODB_URI) {
    // In production, log a warning but don't crash
    if (process.env.NODE_ENV === 'production') {
      console.warn('MongoDB URI not found, database connections will fail');
      // Return a mock connection to prevent crashes
      return null;
    }
    // In development, throw an error
    throw new Error('MongoDB URI is required');
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    // In production, don't crash the app
    if (process.env.NODE_ENV === 'production') {
      return null;
    }
    throw error;
  }
}

export default dbConnect;
