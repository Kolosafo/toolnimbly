import type { Metadata } from 'next';

import { absoluteUrl, isIndexable, site } from '@/lib/config/site';

/**
 * Metadata helpers (spec §8.1).
 *
 * Every indexable route builds its metadata here so that canonical URLs,
 * Open Graph data and robots directives cannot drift apart between routes.
 */

type BuildMetadataInput = {
  /** Page title without the site-name suffix. */
  title: string;
  description: string;
  /** Site-root-relative canonical path, e.g. `/tools/loan-calculator`. */
  path: string;
  /** Overrides the default social image. */
  image?: string;
  /** Set for utility routes that should never be indexed. */
  noIndex?: boolean;
  /** `article`-style pages may set a type; defaults to `website`. */
  type?: 'website' | 'article';
};

export const DEFAULT_OG_IMAGE = '/opengraph-image';

export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  type = 'website',
}: BuildMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = path === '/' ? `${site.name} — ${site.tagline}` : `${title} | ${site.name}`;

  // Preview and development deployments are never indexable, whatever the page
  // asks for. Production honours the per-page flag.
  const indexable = isIndexable && !noIndex;

  return {
    title: fullTitle,
    description,
    alternates: {
      // Self-referencing absolute canonical, query strings excluded.
      canonical,
    },
    robots: indexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type,
      url: canonical,
      siteName: site.name,
      title: fullTitle,
      description,
      locale: 'en_US',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
    },
  };
}
