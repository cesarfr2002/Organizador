import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter'; // Cambiado a la nueva ubicación
import clientPromise from '../../../lib/mongodb';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';

console.log('Loading NextAuth configuration...');
console.log('Environment vars in NextAuth config:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise), // El adaptador sigue igual
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize function called with credentials');
        
        try {
          await dbConnect();
          
          // Buscar usuario por email
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            console.log('Invalid credentials');
            return null;
          }
          
          // Verificar contraseña
          const isPasswordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordMatch) {
            console.log('Invalid credentials');
            return null;
          }
          
          // Devolver objeto de usuario sin la contraseña
          console.log('Credentials valid, returning user');
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          };
        } catch (error) {
          console.error('Error in authorize function:', error);
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
      console.log('JWT callback called', { token, user: !!user });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback called', { session, token: !!token });
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Ensure we're always using absolute URLs to avoid 'Invalid URL' errors
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allow callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
