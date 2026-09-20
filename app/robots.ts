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
        // Framework assets must remain crawlable so search engines can render
        // the same styled, interactive page a visitor receives. Query variants
        // are consolidated by the clean self-referencing canonical instead of
        // being hidden from crawlers before they can read that signal.
        disallow: ['/api/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
