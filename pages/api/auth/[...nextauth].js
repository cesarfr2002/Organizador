import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Enable debugging
const debug = true;

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
    
    // Extremely simplified redirect callback that avoids any URL construction
    async redirect({ url, baseUrl }) {
      // For safety, hardcode the URLs
      if (url.startsWith('/dashboard')) {
        return '/dashboard'; 
      }
      if (url.startsWith('/login')) {
        return '/login';
      }
      // Default to dashboard
      return '/dashboard';
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  secret: process.env.NEXTAUTH_SECRET || '57dd7df0034aacd3fec020a220930081d9d3e9318b54c082b55cad978f57c064',
  debug: true, // Always enable debug for troubleshooting
  logger: {
    error(code, metadata) {
      console.error(`[auth] Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`[auth] Warning: ${code}`);
    },
    debug(code, metadata) {
      // Always log debug info
      console.log(`[auth] Debug: ${code}`, metadata);
    }
  },
};

// Create our custom handler without URL/env manipulation
const authHandler = async (req, res) => {
  try {
    console.log("Auth request URL:", req.url);
    
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error("NextAuth error:", error);
    // Return a more detailed error response
    return res.status(500).json({ 
      error: "Internal server error during authentication", 
      message: error.message,
      stack: debug ? error.stack : undefined
    });
  }
};

export default authHandler;
