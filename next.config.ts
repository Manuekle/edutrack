import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  compress: true, // Habilitar compresión gzip
  poweredByHeader: false, // Ocultar header X-Powered-By por seguridad
  reactStrictMode: true,
};

export default nextConfig;
