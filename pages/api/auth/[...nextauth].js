import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Enable debugging for troubleshooting
const debug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

// Ensure we have a valid NEXTAUTH_URL
const getBaseUrl = () => {
  // First try environment variable
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.trim();
  }
  // Fallback to hardcoded URL for production
  return 'https://uorganizer.netlify.app';
};

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) {
          throw new Error('No se proporcionaron credenciales');
        }

        try {
          await dbConnect();
          
          // Buscar usuario por email
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            throw new Error('Email o contraseña incorrectos');
          }
          
          // Verificar contraseña
          const isPasswordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordMatch) {
            throw new Error('Email o contraseña incorrectos');
          }
          
          // Devolver objeto de usuario sin la contraseña
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error(error.message || 'Error en la autenticación');
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
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    
    // Simplified redirect callback that avoids URL construction errors
    async redirect({ url, baseUrl }) {
      // Try to get a working baseUrl
      baseUrl = baseUrl || getBaseUrl();
      
      // If no URL or it's just a hash, return to base URL
      if (!url || url === '#' || url.startsWith('mailto:')) {
        return baseUrl;
      }
      
      // Safely handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Safely check if URL is of same origin, avoid URL constructor for safety
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Default fallback to base URL
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-fallback-for-development-only',
  debug,
  // Add logger for better debugging in production
  logger: {
    error(code, metadata) {
      console.error(`[auth] Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`[auth] Warning: ${code}`);
    },
    debug(code, metadata) {
      if (debug) {
        console.log(`[auth] Debug: ${code}`, metadata);
      }
    }
  },
};

// Create our custom handler with better error handling
const authHandler = async (req, res) => {
  try {
    console.log("Auth request path:", req.url);
    
    // Ensure NEXTAUTH_URL is set
    if (!process.env.NEXTAUTH_URL) {
      const baseUrl = getBaseUrl();
      console.log(`Setting NEXTAUTH_URL to ${baseUrl}`);
      process.env.NEXTAUTH_URL = baseUrl;
    }
    
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error("NextAuth error:", error);
    return res.status(500).json({ 
      error: "Internal server error during authentication", 
      message: error.message 
    });
  }
};

export default authHandler;
