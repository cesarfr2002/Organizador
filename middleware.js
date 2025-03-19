import { NextResponse } from 'next/server'

// Simplificamos completamente el middleware para evitar problemas
// Lo reactivaremos cuando la aplicación se despliegue correctamente
export function middleware() {
  // Permitir todas las solicitudes por ahora
  return NextResponse.next()
}

export const config = {
  matcher: []  // No aplicar el middleware a ninguna ruta por ahora
}
