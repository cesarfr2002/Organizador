import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { connectToDatabase } from "../../../lib/db";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials) return null;
          
          const { db } = await connectToDatabase();
          const user = await db.collection("users").findOne({ 
            email: credentials.email 
          });
          
          if (!user) return null;
          
          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;
          
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || 'Usuario'
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  debug: true,
});
