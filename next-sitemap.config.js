export default {
  siteUrl: process.env.SITE_URL || 'https://sira-fup.vercel.app',
  generateRobotsTxt: true,
  sitemapSize: 5000,
  exclude: [
    '/api/*',
    '/dashboard/admin/*',
    '/dashboard/docente/*',
    '/dashboard/estudiante/*',
    '/_error',
    '/_next/*',
    '/404',
    '/500',
    '/offline',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/*', '/dashboard/*', '/_next/*', '/404', '/500', '/offline'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
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
  ],
};
