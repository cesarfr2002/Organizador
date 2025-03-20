import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'uni-organizer';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  // If we have cached values, use them
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Connect to the MongoDB database
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  // Cache the client and db for reuse
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
