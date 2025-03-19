/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Cambiamos a false para evitar dobles renderizados
  swcMinify: true,
  images: {
    unoptimized: true, // Necesario para Netlify
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://uorganizer.netlify.app",
  },
  // Disable static optimization for all pages since we're using custom auth
  // This will make everything client-side rendered which is safer for our auth system
  experimental: {
    // Avoid static pre-rendering since our authentication is client-side
    appDir: false,
  },
  // Only use SSR for public pages
  async exportPathMap() {
    return {
      '/': { page: '/' },
      '/login': { page: '/login' },
      '/register': { page: '/register' },
    };
  },
  // Asegúrate de que la API funcione correctamente
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig;
