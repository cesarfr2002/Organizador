const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  // Add these settings to fix build errors
  trailingSlash: true, // This can help with routing issues
  // Don't use exportPathMap as it can cause issues with dynamic routes
  // Instead just ensure login page is properly server-rendered
  images: {
    unoptimized: true, // This helps with static exports
  },
  // Custom webpack config to reduce client-side JS
  webpack: (config, { isServer }) => {
    // Optimize for production
    if (!isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all',
        },
      };
    }
    
    return config;
  },
});
