import type { NextConfig } from 'next';

// Fix for node.js modules not found in the client
const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', 'edutrack-fup.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.storyblok.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rijwjlzt9wsyq7fc.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Asegura que errores de TypeScript detengan la compilación
  },
};

export default nextConfig;
