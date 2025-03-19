export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Return environment information to help debug
  return res.status(200).json({
    status: 'success',
    message: 'API test endpoint working',
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasMongoDbUri: !!process.env.MONGODB_URI,
      baseUrl: process.env.NEXTAUTH_URL || process.env.URL || 'not set'
    },
    timestamp: new Date().toISOString()
  });
}
