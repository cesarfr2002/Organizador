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
