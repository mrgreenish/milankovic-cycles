import createNextTranspileModules from 'next-transpile-modules';

const withTM = createNextTranspileModules(['three']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Optimized caching configuration
  staticPageGenerationTimeout: 180, // Increase timeout for complex pages (3 minutes)
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Optimize image sizes
    formats: ['image/webp'], // Prefer WebP format for better compression
  },
  compress: true, // Enable compression
  // Optimize for faster page loads
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  // Set production optimization features
  productionBrowserSourceMaps: false, // Disable source maps in production
  poweredByHeader: false, // Remove the X-Powered-By header
};

export default withTM({
  ...nextConfig,
  // This ensures all pages use ISR with a 6-hour revalidation period
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Add special caching for static assets
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|webp|svg|ico|woff2|woff|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
});