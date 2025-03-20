const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  // Expose environment variables to the browser
  env: {
    NEXT_PUBLIC_NETLIFY_URL: process.env.URL || 'https://uorganizer.netlify.app',
    NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://uorganizer.netlify.app',
    APP_URL: process.env.URL || 'https://uorganizer.netlify.app'
  },
  // Ensure netlify builds properly
  trailingSlash: false,
  images: {
    domains: ['uorganizer.netlify.app']
  }
});
