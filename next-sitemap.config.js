export default {
  siteUrl: process.env.SITE_URL || 'https://edutrack-fup.vercel.app',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: ['/api/*', '/dashboard/*', '/_error', '/_next/*', '/404', '/500'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/*', '/dashboard/*', '/_next/*', '/404', '/500'],
      },
    ],
  },
  changefreq: 'daily',
  priority: 0.7,
  generateIndexSitemap: true,
  outDir: 'public',
  // Additional routes that might not be automatically discovered
  additionalPaths: async config => [
    await config.transform(config, '/'),
    await config.transform(config, '/login'),
    await config.transform(config, '/forgot-password'),
    await config.transform(config, '/reset-password'),
    await config.transform(config, '/dashboard'),
    await config.transform(config, '/dashboard/estudiante'),
    await config.transform(config, '/dashboard/docente'),
    await config.transform(config, '/dashboard/admin'),
  ],
};
