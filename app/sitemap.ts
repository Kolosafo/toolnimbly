import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/config/site';
import { guides, orderedCategories, tools } from '@/lib/registry';
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

  const editorialUpdatedAt = new Date('2026-09-20T00:00:00Z');
  const latestToolOrGuideUpdate = latestDate([
    ...tools.map((tool) => tool.updatedAt),
    ...guides.map((guide) => guide.updatedAt),
  ]);
  const latestGuideUpdate = latestDate(guides.map((guide) => guide.updatedAt));

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: latestToolOrGuideUpdate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl('/guides'),
      lastModified: latestGuideUpdate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/about'),
      lastModified: editorialUpdatedAt,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: absoluteUrl('/privacy'),
      lastModified: editorialUpdatedAt,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/terms'),
      lastModified: editorialUpdatedAt,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/contact'),
      lastModified: editorialUpdatedAt,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = orderedCategories().map((category) => ({
    url: absoluteUrl(`/${category.slug}`),
    lastModified: latestDate([
      ...tools.filter((tool) => tool.category === category.slug).map((tool) => tool.updatedAt),
      ...guides.filter((guide) => guide.category === category.slug).map((guide) => guide.updatedAt),
    ]),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const toolRoutes: MetadataRoute.Sitemap = tools.map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: new Date(`${tool.updatedAt}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: tool.featured ? 0.9 : 0.7,
  }));

  const guideRoutes: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(`${guide.updatedAt}T00:00:00Z`),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes, ...guideRoutes];
}

function latestDate(values: readonly string[]): Date {
  const latest = values.reduce((current, value) => (value > current ? value : current), values[0]!);
  return new Date(`${latest}T00:00:00Z`);
}
