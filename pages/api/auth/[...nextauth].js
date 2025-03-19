import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Debug logs for server-side environment variable availability
console.log('=========== NEXTAUTH SERVER INITIALIZATION ===========');
console.log('[NextAuth] Server-side environment check:');
console.log('- NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
console.log('- NEXTAUTH_URL value:', process.env.NEXTAUTH_URL);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- MONGODB_URI start:', process.env.MONGODB_URI?.substring(0, 20) + '...');
console.log('- NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
console.log('- NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length);
console.log('- URL fallback exists:', !!process.env.URL);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- Request path:', process.env.VERCEL_URL || process.env.URL || 'not available');

// Set a default URL value to prevent errors
const siteUrl = process.env.NEXTAUTH_URL || 
                process.env.URL || 
                process.env.VERCEL_URL || 
                'https://uorganizer.netlify.app';

console.log('- Using site URL:', siteUrl);
console.log('=========== END NEXTAUTH INITIALIZATION ===========');

export const authOptions = {
  // Temporarily remove MongoDB adapter until we verify basic auth works
  // adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        try {
          console.log('=========== AUTHORIZE ATTEMPT ===========');
          console.log(`Authorization attempt for email: ${credentials.email}`);
          console.log('Request headers:', JSON.stringify(req.headers, null, 2));
          console.log('Request method:', req.method);
          console.log('Request body present:', !!req.body);
          
          await dbConnect();
          console.log('Database connection established');
          
          // Buscar usuario por email
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            console.log(`User not found for email: ${credentials.email}`);
            console.log('=========== END AUTHORIZE ATTEMPT (NO USER) ===========');
            return null;
          }
          
          console.log(`User found, ID: ${user._id}`);
          
          // Verificar contraseña
          const isPasswordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          console.log(`Password match result: ${isPasswordMatch}`);
          
          if (!isPasswordMatch) {
            console.log(`Password doesn't match for: ${credentials.email}`);
            console.log('=========== END AUTHORIZE ATTEMPT (BAD PASSWORD) ===========');
            return null;
          }
          
          console.log(`Successfully authorized: ${credentials.email}`);
          console.log('=========== END AUTHORIZE ATTEMPT (SUCCESS) ===========');
          
          // Devolver objeto de usuario sin la contraseña
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          };
        } catch (error) {
          console.error('=========== AUTHORIZE ERROR ===========');
          console.error('Authorization error:', error);
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          console.error('=========== END AUTHORIZE ERROR ===========');
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT Callback - token before:', token ? 'Has token' : 'No token');
      console.log('JWT Callback - user provided:', user ? 'Has user' : 'No user');
      
      if (user) {
        token.id = user.id;
        console.log('JWT Callback - added user ID to token');
      }
      
      console.log('JWT Callback - returning token');
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - session before:', session ? 'Has session' : 'No session');
      console.log('Session Callback - token provided:', token ? 'Has token' : 'No token');
      
      if (token) {
        session.user.id = token.id;
        console.log('Session Callback - added token ID to session');
      }
      
      console.log('Session Callback - returning session');
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback executing');
      console.log('- Original URL:', url);
      console.log('- Base URL:', baseUrl);
      
      // Simplify redirect to avoid errors
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug for all environments until we fix the issue
  trustHost: true, // Important for Netlify deployment
  site: siteUrl, // Provide fallback site URL
};

// Export a custom handler to add logging
export default async function auth(req, res) {
  console.log(`NextAuth Handler - Method: ${req.method}, URL: ${req.url}`);
  
  // Add CORS headers to help with Netlify deployments
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error('NextAuth Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
