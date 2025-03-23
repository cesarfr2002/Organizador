const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure images are properly optimized and work on Netlify
  images: {
    domains: [], // Add any image domains you're using
    unoptimized: process.env.NODE_ENV === 'production', // For Netlify deployments
  },
  // Add this to make API routes work properly on Netlify
  serverRuntimeConfig: {
    // Will only be available on the server side
    mongodb_uri: process.env.MONGODB_URI,
    nextauth_secret: process.env.NEXTAUTH_SECRET,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    nextauth_url: process.env.NEXTAUTH_URL || 'https://uorganizer.netlify.app',
  },
  // Ensure trailing slashes are handled properly
  trailingSlash: false,
  // Specify async headers for CORS
  async headers() {
    return [
      {
        // Allow CORS for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
}

module.exports = withPWA(nextConfig);
