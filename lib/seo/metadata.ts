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
  /** Descriptive alternative text for the social image. */
  imageAlt?: string;
  /** Set for utility routes that should never be indexed. */
  noIndex?: boolean;
  /**
   * Keeps `follow` alive on a noindexed page.
   *
   * The default pairs `noindex` with `nofollow`, which is right for a preview
   * of an unfinished page. It is wrong for a live page that is deliberately
   * kept out of the index but still links onward to pages that are in it — a
   * survey landing page being the case this exists for.
   */
  followWhenNoIndexed?: boolean;
  /** `article`-style pages may set a type; defaults to `website`. */
  type?: 'website' | 'article';
};

export const DEFAULT_OG_IMAGE = '/opengraph-image';

export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  noIndex = false,
  followWhenNoIndexed = false,
  type = 'website',
}: BuildMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = path === '/' ? `${site.name} — ${site.tagline}` : `${title} | ${site.name}`;

  // Preview and development deployments are never indexable, whatever the page
  // asks for. Production honours the per-page flag.
  const indexable = isIndexable && !noIndex;
  const socialImage = { url: image, width: 1200, height: 630, alt: imageAlt ?? title };

  return {
    // `absolute` bypasses the root layout's title template. Returning a bare
    // string here would let the template append the site name a second time.
    title: { absolute: fullTitle },
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
      : { index: false, follow: followWhenNoIndexed, nocache: true },
    openGraph: {
      type,
      url: canonical,
      siteName: site.name,
      title: fullTitle,
      description,
      locale: 'en_US',
      images: [socialImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [socialImage],
      ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
    },
  };
}
