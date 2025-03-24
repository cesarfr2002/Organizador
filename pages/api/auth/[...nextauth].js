import NextAuth from "next-auth";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "../../../lib/mongodb";
import User from "../../../models/User";
import dbConnect from "../../../lib/dbConnect";
import bcrypt from "bcryptjs";

// Debug logging
console.log("===== NEXTAUTH ENVIRONMENT VARIABLES CHECK =====");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ Set" : "❌ Missing");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("NETLIFY:", process.env.NETLIFY ? "✅ Running on Netlify" : "Not on Netlify");
console.log("URL (Netlify):", process.env.URL || "Not set");
console.log("DEPLOY_URL (Netlify):", process.env.DEPLOY_URL || "Not set");
console.log("============================================");

// CRITICAL FIX: Remove any custom URL determination - let NextAuth handle it
export const authOptions = {
  // Use the secret for signing cookies
  secret: process.env.NEXTAUTH_SECRET,
  
  // Session configuration - JWT is crucial for Netlify
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // CRUCIAL: Disable debug in production to avoid URL construction issues
  debug: false,
  
  // Configure logging
  logger: {
    error(code, metadata) {
      console.error(`NextAuth Error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth Warning: ${code}`);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth Debug: ${code}`, metadata);
      }
    },
  },
  
  // Connect to MongoDB
  adapter: MongoDBAdapter(clientPromise),
  
  // Authentication providers
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
  
  // Callbacks
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
  
  // Page redirects
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // CRITICAL FIX: Add more reliable error handling
  events: {
    error: ({ message }) => {
      console.error(`NextAuth error event: ${message}`);
    }
  }
};

export default NextAuth(authOptions);
