import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Hard-coded base URL - this can be more reliable than environment variables in Netlify
const BASE_URL = 'https://uorganizer.netlify.app';

// Enable debugging for troubleshooting
const debug = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

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
  // Define the base URL directly in the NextAuth config
  url: BASE_URL,
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
    
    // Simplified redirect callback with hard-coded URL
    async redirect({ url }) {
      // If URL is relative, append to base URL
      if (url.startsWith('/')) {
        return `${BASE_URL}${url}`;
      }
      
      // If URL is already the full site URL, use it
      if (url.startsWith(BASE_URL)) {
        return url;
      }
      
      // Default fallback to base URL
      return BASE_URL;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  // Use hard-coded secret if environment variable isn't available
  secret: process.env.NEXTAUTH_SECRET || '57dd7df0034aacd3fec020a220930081d9d3e9318b54c082b55cad978f57c064',
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

// Create our custom handler without trying to set environment variables
const authHandler = async (req, res) => {
  try {
    // Don't try to modify environment variables here
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
