import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../lib/mongodb";
import User from "../../../models/User";
import dbConnect from "../../../lib/dbConnect";
import bcrypt from "bcryptjs";

// Enhanced environment variable logging
console.log("===== NEXTAUTH ENVIRONMENT VARIABLES CHECK =====");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("NETLIFY:", process.env.NETLIFY ? "✅ Running on Netlify" : "Not on Netlify");
console.log("URL (Netlify):", process.env.URL || "Not set");
console.log("DEPLOY_URL (Netlify):", process.env.DEPLOY_URL || "Not set");
console.log("============================================");

// Helper function to determine the base URL
const getBaseUrl = () => {
  // For Netlify deployments, use environment variable
  if (process.env.NETLIFY) {
    console.log("Netlify deployment detected");
    // Use site URL from Netlify
    return process.env.URL || process.env.NEXTAUTH_URL;
  }
  
  // For local development
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }
  
  // For other production deployments
  return process.env.NEXTAUTH_URL;
};

// Ensure we have a valid base URL
const baseUrl = getBaseUrl();
console.log("Determined baseUrl:", baseUrl);

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true, // Enable NextAuth.js debugging
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning: ${code}`);
    },
    debug(code, metadata) {
      console.log(`NextAuth Debug: ${code}`, metadata);
    },
  },
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        console.log("CredentialsProvider authorize called");
        
        if (!credentials) {
          console.error("No credentials provided");
          return null;
        }
        
        try {
          await dbConnect();
          
          // Buscar usuario por email
          console.log("Looking for user with email:", credentials.email);
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            console.log("User not found");
            return null;
          }
          
          // Verificar contraseña
          console.log("Comparing password");
          const isPasswordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordMatch) {
            console.log("Password does not match");
            return null;
          }
          
          // Log successful login
          console.log("User authenticated successfully:", user._id);
          
          // Devolver objeto de usuario sin la contraseña
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback called", { hasUser: !!user });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback called", { hasToken: !!token });
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
  // Properly define the base URL
  ...(baseUrl ? { url: baseUrl } : {}),
};

export default NextAuth(authOptions);
