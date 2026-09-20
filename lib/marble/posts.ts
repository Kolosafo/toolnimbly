/**
 * Marble data access (docs/marble-integration.md §5, §8).
 *
 * Every function here is defensive in the same way: a CMS outage degrades the
 * blog rather than failing the build or 500-ing the site. `generateStaticParams`
 * falling back to an empty list means posts render on demand instead of at
 * build time; the sitemap falling back means it ships the code-managed routes
 * without the posts.
 */

import 'server-only';

import type { Post } from '@usemarble/sdk/models';

import { features } from '@/lib/config/features';

import { getMarbleClient } from './client';
import { assertPublishedPostSeoReady, assertPublishedPostSet, isPublishedPost } from './seo';

/** Posts in this category back the legal pages and never appear in the blog. */
const EXCLUDED_CATEGORIES = ['legal'];

/** Marble's page size. The iterator walks every page regardless of this. */
const PAGE_SIZE = 100;

/**
 * Every published post, following pagination to the end.
 *
 * Returns an empty array when the blog is disabled or the CMS is unreachable.
 * The caller decides what an empty list means — an empty index, or a sitemap
 * with no post entries.
 */
export async function listAllPosts(): Promise<Post[]> {
  if (!features.blogEnabled) return [];

  /*
   * Deliberately outside the try. A missing API key is a configuration error,
   * not a CMS outage: swallowing it would render an empty blog that looks
   * merely unpopulated, which is the silent failure this whole arrangement is
   * meant to avoid. Network and API failures below are a different matter and
   * do degrade.
   */
  const client = getMarbleClient();

  let posts: Post[];
  try {
    posts = [];
    const pages = await client.posts.list({
      limit: PAGE_SIZE,
      excludeCategories: EXCLUDED_CATEGORIES,
      status: 'published',
    });

    // The returned value is async-iterable: `limit` is the page size, not a cap.
    for await (const page of pages) {
      if (page.result.posts) posts.push(...page.result.posts);
    }
  } catch (error) {
    console.error('[marble] could not list posts:', error);
    return [];
  }

  // The API filter is the primary control; the local guard protects against a
  // malformed response and keeps drafts out of pages, static params and XML.
  const published = posts.filter(isPublishedPost);
  assertPublishedPostSet(published);
  return published;
}

/**
 * One post by slug, or `null`.
 *
 * `posts.get` does not reliably throw for a missing slug, so the shape of the
 * response is checked rather than trusted. Both the page and its
 * `generateMetadata` call this with the same argument; Next.js dedupes that
 * within a request, so it is one network call.
 */
export async function getPost(slug: string): Promise<Post | null> {
  if (!features.blogEnabled) return null;

  // Same split as above: configuration errors throw, request failures degrade.
  const client = getMarbleClient();

  let post: Post | null;
  try {
    const data = await client.posts.get({ identifier: slug, status: 'published' });
    post = data?.post ?? null;
  } catch (error) {
    console.error(`[marble] could not load post "${slug}":`, error);
    return null;
  }

  if (!post || !isPublishedPost(post)) return null;
  // Content errors are not outages. Let them surface so a published page can
  // never silently degrade to a misleading 404 or an incomplete SEO template.
  assertPublishedPostSeoReady(post);
  return post;
}

/** The post to feature on the index, and the rest in order. */
export function splitFeatured(posts: readonly Post[]): {
  featured: Post | null;
  rest: Post[];
} {
  const featured = posts.find((post) => post.featured) ?? null;
  /*
   * The integration guide's version of this filter reads
   * `!featured?.id && post.id !== featured?.id`, which is true only when there
   * is no featured post — so the moment one exists the remaining list empties
   * and the whole section disappears. Excluding the featured post by id is all
   * that was intended.
   */
  return { featured, rest: posts.filter((post) => post.id !== featured?.id) };
}
