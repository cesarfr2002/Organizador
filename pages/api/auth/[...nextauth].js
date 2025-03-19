import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

// Make sure we have a valid NEXTAUTH_URL
const BASE_URL = process.env.NEXTAUTH_URL || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
  (process.env.URL ? process.env.URL : 'http://localhost:3000'));

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
      try {
        // Handle relative URLs
        if (!url || url === '') return baseUrl;
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        
        // Check if URL is valid before creating URL object
        const urlPattern = /^(https?:\/\/)/;
        if (!urlPattern.test(url)) return baseUrl;
        
        // Allow same-origin URLs
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) return url;
        
        return baseUrl;
      } catch (error) {
        console.error('Redirect error:', error);
        return baseUrl;
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',  // Add a custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode temporarily to see detailed errors
};

export default NextAuth(authOptions);
