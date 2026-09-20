import type { MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/config/site';
import { features } from '@/lib/config/features';
import { listAllPosts } from '@/lib/marble/posts';
import { blogPostDates, blogPostSitemapEntries } from '@/lib/marble/seo';
import { guides, orderedCategories, tools } from '@/lib/registry';
import { assertRegistryValid } from '@/lib/registry/validate';

/**
 * Sitemap generated from the registry (spec §8.1), so a tool cannot exist
 * without being listed and cannot be listed twice.
 *
 * Registry validation runs here as well: the sitemap is built during
 * `next build`, so a broken registry fails the build rather than shipping.
 */
/*
 * The sitemap lists CMS posts, so it has the same staleness problem as the
 * blog index and the same fix. An hour is ample: search engines re-fetch a
 * sitemap on their own schedule, not on ours.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  /*
   * Blog entries come from the CMS, so this is the one part of the sitemap
   * that can fail. `listAllPosts` already degrades to an empty array on an
   * outage, which ships a sitemap of the code-managed routes rather than a
   * 500 — a temporarily shorter sitemap is far better than none.
   */
  const posts = features.blogEnabled ? await listAllPosts() : [];

  const blogRoutes: MetadataRoute.Sitemap = features.blogEnabled
    ? [
        {
          url: absoluteUrl('/blog'),
          // The index changes when its newest post does, not on every build.
          lastModified: posts.reduce<Date>((latest, post) => {
            const stamp = blogPostDates(post).modified;
            return stamp > latest ? stamp : latest;
          }, editorialUpdatedAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        },
        // The helper defensively filters drafts and uses Marble's persisted
        // updatedAt value. No build timestamp is substituted.
        ...blogPostSitemapEntries(posts),
      ]
    : [];

  return [...staticRoutes, ...categoryRoutes, ...toolRoutes, ...guideRoutes, ...blogRoutes];
}

function latestDate(values: readonly string[]): Date {
  const latest = values.reduce((current, value) => (value > current ? value : current), values[0]!);
  return new Date(`${latest}T00:00:00Z`);
}
