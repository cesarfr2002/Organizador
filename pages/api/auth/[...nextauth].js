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
        console.log("Authorize llamado con credenciales:", credentials?.email);
        
        if (!credentials) {
          console.error("No se proporcionaron credenciales");
          return null;
        }
        
        try {
          const { db } = await connectToDatabase();
          console.log("Conexión a la base de datos establecida");
          
          const user = await db.collection("users").findOne({ 
            email: credentials.email 
          });
          
          if (!user) {
            console.error("Usuario no encontrado:", credentials.email);
            return null;
          }
          
          const isValid = await compare(
            credentials.password,
            user.password
          );
          
          if (!isValid) {
            console.error("Contraseña inválida para:", credentials.email);
            return null;
          }
          
          console.log("Autenticación exitosa para:", credentials.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || 'Usuario'
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: true,
});
