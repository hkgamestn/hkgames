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
    formats: ['image/webp'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'hkgames.tn'],
    },
  },
}

module.exports = nextConfig
