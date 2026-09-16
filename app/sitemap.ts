import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/config/site';
import { orderedCategories, tools } from '@/lib/registry';
import { assertRegistryValid } from '@/lib/registry/validate';

/**
 * Sitemap generated from the registry (spec §8.1), so a tool cannot exist
 * without being listed and cannot be listed twice.
 *
 * Registry validation runs here as well: the sitemap is built during
 * `next build`, so a broken registry fails the build rather than shipping.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  assertRegistryValid();

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: absoluteUrl('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/contact'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = orderedCategories().map((category) => ({
    url: absoluteUrl(`/${category.slug}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: new Date(`${tool.updatedAt}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: tool.featured ? 0.9 : 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes];
}
