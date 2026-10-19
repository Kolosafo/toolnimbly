/**
 * Marble data access (docs/marble-integration.md §5, §8).
 *
 * Failed CMS requests must not become successful empty pages or false 404s.
 * Throwing lets Next.js retain the last successful ISR result and retry,
 * instead of replacing the blog or sitemap with incomplete content.
 */

import 'server-only';

import type { Post } from '@usemarble/sdk/models';
import { MarbleError } from '@usemarble/sdk/models/errors';

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
 * An empty array means the blog is disabled or the CMS returned no posts.
 * Request failures propagate, including a failure on a later page.
 */
export async function listAllPosts(): Promise<Post[]> {
  if (!features.blogEnabled) return [];

  // Configuration errors retain the actionable message from the client.
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
      if (!Array.isArray(page.result.posts)) throw new Error('Missing posts collection');
      posts.push(...page.result.posts);
    }
  } catch (error) {
    throw cmsRequestError('list posts', error);
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
 * Only a real missing or unpublished post returns null. Both the page and its
 * `generateMetadata` call this with the same argument; Next.js dedupes that
 * within a request, so it is one network call.
 */
export async function getPost(slug: string): Promise<Post | null> {
  if (!features.blogEnabled) return null;

  // Configuration errors retain the actionable message from the client.
  const client = getMarbleClient();

  let post: Post | null;
  try {
    const data = await client.posts.get({ identifier: slug, status: 'published' });
    if (!data || !('post' in data)) throw new Error('Missing post response');
    post = data?.post ?? null;
  } catch (error) {
    if (error instanceof MarbleError && error.statusCode === 404) return null;
    throw cmsRequestError('load post', error);
  }

  if (!post || !isPublishedPost(post)) return null;
  // Content errors are not outages. Let them surface so a published page can
  // never silently degrade to a misleading 404 or an incomplete SEO template.
  assertPublishedPostSeoReady(post);
  return post;
}

/** SDK errors can include raw response data; expose only the operation/status. */
function cmsRequestError(operation: string, error: unknown): Error {
  const status = error instanceof MarbleError ? ` (HTTP ${error.statusCode})` : '';
  return new Error(`[marble] could not ${operation}${status}`);
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
