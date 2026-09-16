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
    | 'none'
    | 'vercel'
    | 'plausible',
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
} as const;

/**
 * A consent banner is only required once a provider that sets identifiers or
 * profiles users is enabled. With everything off, no banner is shown — which
 * is the launch configuration.
 */
export const consentBannerRequired =
  features.adsEnabled || (features.analyticsEnabled && features.analyticsProvider !== 'vercel');
