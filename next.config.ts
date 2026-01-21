import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  compress: true, // Habilitar compresión gzip
  poweredByHeader: false, // Ocultar header X-Powered-By por seguridad
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },

  typescript: {
    // Opcional: también puedes ignorar errores de TypeScript durante el build
    // ignoreBuildErrors: true,
  },
} as NextConfig;

export default nextConfig;
