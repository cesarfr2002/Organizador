import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Si el usuario intenta acceder a una ruta protegida sin autenticación,
    // será manejado automáticamente por withAuth
    
    // Puedes agregar lógica adicional aquí si es necesario
    return NextResponse.next();
  },
  {
    // Configuración para withAuth
    callbacks: {
      authorized: ({ token }) => !!token, // Autorizado si hay un token presente
    },
  }
);

// Configurar qué rutas están protegidas por este middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/notes/:path*",
    "/subjects/:path*",
    "/schedule/:path*",
    "/calendar/:path*",
    "/api/tasks/:path*",
    "/api/subjects/:path*",
    "/api/notes/:path*",
    // Agrega otras rutas protegidas aquí
  ],
};
