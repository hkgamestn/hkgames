/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 160, 240, 256],
    minimumCacheTTL: 604800,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'hkgames.tn'],
    },
  },
}

module.exports = nextConfig
