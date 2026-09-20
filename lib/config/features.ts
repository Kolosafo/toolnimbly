/**
 * Feature flags (spec §7.10).
 *
 * Analytics and advertising are off by default and stay off until the owner
 * completes the privacy, consent and policy review described in spec §9 and
 * §13.1. The code paths exist and are tested; they simply emit nothing.
 */

function flag(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
}

export const features = {
  /** Master switch for anonymous analytics. Off until configured. */
  analyticsEnabled: flag(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED),
  /** Provider identifier, only meaningful when analytics are enabled. */
  analyticsProvider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? 'none') as
    'none' | 'ga4' | 'vercel' | 'plausible',
  analyticsSiteId: process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID ?? '',

  /** Master switch for ad slots. Off for launch (spec §9 "Ads"). */
  adsEnabled: flag(process.env.NEXT_PUBLIC_ADS_ENABLED),
  adsProvider: process.env.NEXT_PUBLIC_ADS_PROVIDER ?? 'none',
  adsClientId: process.env.NEXT_PUBLIC_ADS_CLIENT_ID ?? '',

  /**
   * Opt-in local draft persistence for the invoice and receipt generators.
   * Uses `localStorage` only and always exposes a delete control.
   */
  documentDraftsEnabled: flag(process.env.NEXT_PUBLIC_DOCUMENT_DRAFTS_ENABLED, true),

  /** Reserved for the optional static-export deployment profile (spec §13.2). */
  staticExportMode: flag(process.env.NEXT_PUBLIC_STATIC_EXPORT),

  /**
   * The Marble-backed blog at /blog.
   *
   * Off by default, and deliberately a flag rather than an inferred value: the
   * blog is the only part of this site that depends on a third party being
   * reachable at build time. With it off, no Marble request is made, the
   * routes are not generated, /blog is not linked or listed in the sitemap,
   * and a missing API key cannot fail a build of the 30 tools and 7 guides
   * that have nothing to do with the CMS.
   */
  blogEnabled: flag(process.env.NEXT_PUBLIC_BLOG_ENABLED),
} as const;

/**
 * A consent banner is only required once a provider that sets identifiers or
 * profiles users is enabled. With everything off, no banner is shown — which
 * is the launch configuration.
 */
export const consentBannerRequired =
  features.adsEnabled || (features.analyticsEnabled && features.analyticsProvider !== 'vercel');
