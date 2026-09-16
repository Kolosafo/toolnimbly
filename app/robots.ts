import type { MetadataRoute } from 'next';

import { absoluteUrl, isIndexable } from '@/lib/config/site';

/**
 * Production allows the public routes and points at the sitemap. Anything that
 * is not production returns a blanket disallow, so a preview deployment cannot
 * be indexed even if its `X-Robots-Tag` header were missed (spec §8.1).
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Query-string variants are canonicalised to the clean tool URL, so
        // there is nothing to gain from crawling them (spec §8.1).
        disallow: ['/api/', '/_next/', '/*?*'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
