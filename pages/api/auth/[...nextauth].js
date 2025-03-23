import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../lib/mongodb";
import User from "../../../models/User";
import dbConnect from "../../../lib/dbConnect";
import bcrypt from "bcryptjs";

// Make sure to import the environment variables

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await dbConnect();
        
        // Buscar usuario por email
        const user = await User.findOne({ email: credentials.email });
        
        if (!user) {
          return null;
        }
        
        // Verificar contraseña
        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        
        if (!isPasswordMatch) {
          return null;
        }
        
        // Devolver objeto de usuario sin la contraseña
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  // Update callbacks to handle Netlify serverless environment
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
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
