import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pulse-glucose-web.vercel.app';
  const routes = [
    '',
    '/api',
    '/apps',
    '/docs',
    '/docs/getting-started',
    '/docs/authentication',
    '/docs/workflows',
    '/docs/endpoints',
    '/docs/errors',
    '/agents'
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7
  }));
}
