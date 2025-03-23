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
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    nextauth_url: process.env.NEXTAUTH_URL,
  },
}

module.exports = withPWA(nextConfig);
