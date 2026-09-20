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

  /**
   * The invoice payment terms research survey.
   *
   * Off, and off for a reason: no survey provider and no first-party
   * collection backend has been approved, so there is nothing to link to. With
   * it off, `/research/invoice-payment-terms-survey` returns a real 404 and
   * `/privacy` says nothing about collecting survey responses — which is
   * accurate, because none are being collected.
   *
   * These three are necessary and not sufficient. `surveyCollection()` in
   * lib/research/survey.ts also requires a recorded provider assurance, so a
   * URL alone cannot turn on pages that make promises about how the provider
   * behaves. See docs/research/data-handling.md §2.
   */
  researchSurveyEnabled: flag(process.env.NEXT_PUBLIC_RESEARCH_SURVEY_ENABLED),
  /** The approved form's URL. Server-side validated; never a secret. */
  researchSurveyUrl: process.env.NEXT_PUBLIC_RESEARCH_SURVEY_URL?.trim() ?? '',
  /** The provider's name, stated before a participant leaves the site. */
  researchSurveyProvider: process.env.NEXT_PUBLIC_RESEARCH_SURVEY_PROVIDER?.trim() ?? '',

  /**
   * The public benchmark report.
   *
   * The owner's publication switch, and only half of the gate: the route also
   * requires a validated aggregate summary on disk. Neither alone is enough,
   * so the report cannot ship on a flag flip with no data, nor on data alone
   * without approval.
   */
  researchBenchmarkPublished: flag(process.env.NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED),
} as const;

/**
 * A consent banner is only required once a provider that sets identifiers or
 * profiles users is enabled. With everything off, no banner is shown — which
 * is the launch configuration.
 */
export const consentBannerRequired =
  features.adsEnabled || (features.analyticsEnabled && features.analyticsProvider !== 'vercel');
