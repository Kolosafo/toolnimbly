import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SkipLink } from '@/components/layout/skip-link';
import { JsonLd } from '@/components/seo/json-ld';
import { features } from '@/lib/config/features';
import { organizationSchema, websiteSchema } from '@/lib/seo/structured-data';

/**
 * The full site chrome: skip link, header, main landmark, footer and the
 * site-wide structured data.
 *
 * This lives in a component rather than in the root layout because the embed
 * routes (`/embed/[slug]`) must render the bare tool with no navigation — they
 * are framed on other people's sites, where our header and footer would be
 * both unwelcome and confusing. A root layout applies to every route and
 * cannot opt a subtree out, so the chrome is applied by the `(site)` group
 * layout instead and the embed routes simply do not use it.
 *
 * `not-found` and `error` at the app root sit outside the `(site)` group, so
 * they render this themselves.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const ga4MeasurementId =
    features.analyticsEnabled &&
    features.analyticsProvider === 'ga4' &&
    /^G-[A-Z0-9]+$/.test(features.analyticsSiteId)
      ? features.analyticsSiteId
      : null;

  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <JsonLd data={[websiteSchema(), organizationSchema()]} />
      {ga4MeasurementId ? <GoogleAnalytics measurementId={ga4MeasurementId} /> : null}
    </>
  );
}
