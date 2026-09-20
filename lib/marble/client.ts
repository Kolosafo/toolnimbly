/**
 * Marble CMS client (docs/marble-integration.md §5).
 *
 * Server-only. `MARBLE_API_KEY` has no NEXT_PUBLIC_ prefix, so Next.js never
 * inlines it into a client bundle, and every call site here is a Server
 * Component, a `generateMetadata`, a route handler or `sitemap.ts`.
 */

import 'server-only';

import { HTTPClient, Marble } from '@usemarble/sdk';

import { MARBLE_CACHE_TAG } from './cache-tag';

/*
 * The SDK performs its own `fetch` internally, so injecting a fetcher is the
 * only way to attach a Next.js cache tag to its requests. Tagging them all
 * lets the publish webhook invalidate every piece of CMS data — the blog
 * index, each post, the sitemap — with a single `revalidateTag`.
 */
const marbleFetcher = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, { ...init, next: { tags: [MARBLE_CACHE_TAG] } });

let client: Marble | undefined;

/**
 * The shared client, created on first use.
 *
 * The integration guide constructs this at module scope and throws on import
 * when the key is missing, so that a key-less build fails loudly instead of
 * rendering empty pages. That is right for a site which *is* the blog. Here
 * the blog is one section beside 30 tools and 7 guides, and an import-time
 * throw would break `next build`, the test suite and CI for everyone until a
 * key exists — including for work that never touches the CMS.
 *
 * So the failure is moved rather than removed: `features.blogEnabled` decides
 * whether the blog is built at all, and if it is built without a key this
 * still throws, at the first request, with the same loudness. Nothing renders
 * an empty blog silently.
 */
export function getMarbleClient(): Marble {
  if (client) return client;

  const apiKey = process.env.MARBLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'MARBLE_API_KEY is not set, but the blog is enabled. Set the key, or set ' +
        'NEXT_PUBLIC_BLOG_ENABLED=false to build without the blog.',
    );
  }

  client = new Marble({
    apiKey,
    httpClient: new HTTPClient({ fetcher: marbleFetcher }),
  });
  return client;
}

export { MARBLE_CACHE_TAG };
