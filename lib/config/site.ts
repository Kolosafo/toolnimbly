/**
 * Central site configuration (spec §7.10).
 *
 * Every brand, legal, contact and URL value used anywhere in the product is
 * defined here exactly once. Nothing else in the codebase may hardcode the
 * product name, domain or contact address.
 */

/** The canonical production origin. Overridable per environment. */
// The deployed apex permanently redirects here. Canonicals, sitemap entries
// and social URLs must name the redirect target rather than the source.
const PRODUCTION_URL = 'https://www.toolnimbly.com';

/** Local development fallback when no environment variable is present. */
const DEVELOPMENT_URL = 'http://localhost:3000';

/**
 * Deployment stage.
 *
 * `preview` covers Vercel preview deployments and any non-production hosted
 * build. Preview deployments are noindexed (spec §8.1).
 */
export type DeploymentStage = 'development' | 'preview' | 'production';

function resolveStage(): DeploymentStage {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview' || vercelEnv === 'development') {
    return vercelEnv === 'preview' ? 'preview' : 'development';
  }
  if (process.env.NODE_ENV === 'production') {
    // A production build with no Vercel signal: treat an explicitly configured
    // canonical URL as production, anything else as preview (safe default).
    return process.env.NEXT_PUBLIC_SITE_URL ? 'production' : 'preview';
  }
  return 'development';
}

export const deploymentStage: DeploymentStage = resolveStage();

function normalizeOrigin(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) return normalizeOrigin(configured);

  if (deploymentStage === 'production') {
    // Spec §7.10: emit an unmistakable warning when the canonical URL is
    // missing from a production build rather than silently shipping a wrong
    // canonical host.
    console.warn(
      '\n[ToolNimbly] WARNING: NEXT_PUBLIC_SITE_URL is not set for this production build.\n' +
        `Falling back to ${PRODUCTION_URL}. Canonical URLs, the sitemap and Open Graph\n` +
        'metadata will point at that origin. Set NEXT_PUBLIC_SITE_URL to silence this.\n',
    );
    return PRODUCTION_URL;
  }

  // Preview deployments get their own origin so links inside a preview stay
  // inside the preview. These pages are noindexed, so canonical drift is safe.
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (deploymentStage === 'preview' && vercelUrl) return normalizeOrigin(vercelUrl);

  return DEVELOPMENT_URL;
}

export const siteUrl = resolveSiteUrl();

/** Contact address used by Contact, Privacy, Terms and SECURITY.md. */
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'admin@toolnimbly.com';

/**
 * The legal entity named in Terms and Privacy. Left as a placeholder until the
 * owner supplies a registered name (spec Appendix C); `legalEntityConfigured`
 * drives the production-readiness guard.
 */
const legalEntity = process.env.NEXT_PUBLIC_LEGAL_ENTITY?.trim() ?? '';

/** Governing jurisdiction named in Terms. Placeholder until owner-supplied. */
const jurisdiction = process.env.NEXT_PUBLIC_JURISDICTION?.trim() ?? '';

export const site = {
  name: 'ToolNimbly',
  shortName: 'ToolNimbly',
  tagline: 'Fast, private browser tools that never upload your files.',
  description:
    'Free online calculators, text utilities, image editors, PDF tools and invoice generators. ' +
    'Everything runs in your browser — your files and text never leave your device.',
  url: siteUrl,
  locale: 'en',
  /** BCP 47 locale used as the formatting fallback when the browser has none. */
  formattingLocale: 'en-US',
  contactEmail,
  securityEmail: contactEmail,
  legalEntity,
  jurisdiction,
  /** Year the site first published; used for copyright ranges. */
  foundedYear: 2026,
  twitterHandle: '' as string,
} as const;

export const isProduction = deploymentStage === 'production';
export const isIndexable = deploymentStage === 'production';

/**
 * True when every owner-supplied legal value in Appendix C has been provided.
 * The About/Privacy/Terms pages surface an explicit notice when it is false so
 * a build with placeholder legal values cannot be mistaken for launch-ready.
 */
export const legalDetailsConfigured = legalEntity.length > 0 && jurisdiction.length > 0;

/** Build an absolute URL from a site-root-relative path. */
export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) return `${site.url}/${path}`;
  return `${site.url}${path === '/' ? '' : path}`;
}
