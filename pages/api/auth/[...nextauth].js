import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Enable this to debug issues
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
    async redirect({ url, baseUrl }) {
      // Better URL handling
      if (!url) return baseUrl;
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Only allow same-origin redirects for security
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (error) {
        console.error('Error parsing URL in redirect callback:', error);
      }
      
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: debug,
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

// Create our custom handler
const authHandler = async (req, res) => {
  try {
    // Ensure NEXTAUTH_URL is properly set
    if (!process.env.NEXTAUTH_URL) {
      console.warn("NEXTAUTH_URL environment variable is not set. This can cause redirect issues.");
      // Try to construct it from request headers as a fallback
      if (req.headers.host) {
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        process.env.NEXTAUTH_URL = `${protocol}://${req.headers.host}`;
        console.log(`Setting NEXTAUTH_URL to ${process.env.NEXTAUTH_URL}`);
      }
    }
    
    return await NextAuth(req, res, authOptions);
  } catch (error) {
    console.error("NextAuth error:", error);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
};

export default authHandler;
