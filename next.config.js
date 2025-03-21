const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  swcMinify: true,
  // Add this setting to fix the build error
  unstable_runtimeJS: true,
  // Exclude login page from static generation
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // Remove login from static export
    const paths = { ...defaultPathMap };
    delete paths['/login']; 
    return paths;
  },
});
