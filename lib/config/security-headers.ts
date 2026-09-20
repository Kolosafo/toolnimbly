/**
 * Security headers and Content Security Policy (spec §7.9, ADR 0006).
 *
 * The policy is static-compatible: it carries no nonce, because every page in
 * this product is prerendered at build time and a nonce must vary per request.
 * See ADR 0006 for the full reasoning and the compensating controls.
 */

import { siteUrl } from './site';

export type HeaderEntry = { key: string; value: string };

/**
 * Build the Content Security Policy.
 *
 * Notes on the directives that are not obvious:
 * - `script-src 'self'` is the default substantive control. A deployment that
 *   explicitly enables GA4 adds only Google Tag Manager's loader origin; the
 *   consent component still makes no request before a visitor opts in.
 * - `'unsafe-inline'` is required for React's hydration bootstrap and the
 *   inline RSC flight-data scripts, which are generated per page at build time
 *   and cannot be hashed stably. It is NOT paired with a nonce, because a
 *   browser ignores `'unsafe-inline'` whenever a nonce or hash is present — a
 *   policy with both silently blocks every script on a prerendered page.
 * - `'wasm-unsafe-eval'` is required by pdf.js, which compiles WebAssembly for
 *   image decoding. It permits WebAssembly compilation only, never `eval`.
 * - There is no `'unsafe-eval'` in production.
 * - `worker-src blob:` is required because the image and PDF workers are
 *   instantiated from bundled blob URLs.
 * - `connect-src 'self'` is the default that enforces the product's core
 *   promise. Consent-gated GA4 adds its two measurement origins, but the event
 *   contract exposes no tool payload or user-entered value to the tracker.
 */
export function buildContentSecurityPolicy(isDev: boolean, embeddable = false): string {
  const ga4Enabled =
    !embeddable &&
    ['true', '1'].includes(process.env.NEXT_PUBLIC_ANALYTICS_ENABLED ?? '') &&
    process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER === 'ga4' &&
    /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID ?? '');

  const scriptSrcBase = isDev
    ? // Next.js dev tooling (HMR, React Refresh) requires eval.
      `'self' 'unsafe-eval' 'unsafe-inline' blob:`
    : `'self' 'unsafe-inline' 'wasm-unsafe-eval'`;
  const scriptSrc = ga4Enabled
    ? `${scriptSrcBase} https://www.googletagmanager.com`
    : scriptSrcBase;
  /*
   * Marble's media hosts, when the blog is on.
   *
   * `next.config.ts` alone is not enough: that governs which hosts
   * `next/image` will optimise, while the CSP governs whether the browser will
   * load the bytes at all. Miss this and cover images fail silently with only
   * a console violation — the exact failure mode ADR 0006 was written about.
   *
   * Images cannot exfiltrate anything, and `connect-src` still refuses every
   * outbound request, so the local-processing promise is untouched.
   */
  const blogEnabled = ['true', '1'].includes(process.env.NEXT_PUBLIC_BLOG_ENABLED ?? '');
  const marbleImages = blogEnabled
    ? ' https://images.marblecms.com https://media.marblecms.com'
    : '';

  const imageSrc =
    (ga4Enabled
      ? `'self' data: blob: https://www.google-analytics.com`
      : `'self' data: blob:`) + marbleImages;
  const connectSrcBase = isDev ? `'self' ws: wss:` : `'self' blob: data:`;
  const connectSrc = ga4Enabled
    ? `${connectSrcBase} https://www.google-analytics.com https://region1.google-analytics.com`
    : connectSrcBase;

  const directives: Record<string, string> = {
    'default-src': `'self'`,
    'script-src': scriptSrc,
    // Next.js injects the critical stylesheet inline and the style attribute is
    // used for chart geometry. Styles cannot exfiltrate data on their own, and
    // `connect-src` blocks outbound requests regardless.
    'style-src': `'self' 'unsafe-inline'`,
    'img-src': imageSrc,
    'font-src': `'self' data:`,
    'connect-src': connectSrc,
    'worker-src': `'self' blob:`,
    'child-src': `'self' blob:`,
    'object-src': `'none'`,
    'base-uri': `'self'`,
    'form-action': `'self'`,
    /*
     * The embed routes exist to be framed on other people's sites, so they
     * must permit it. Every other route refuses framing outright.
     *
     * Allowing any ancestor is safe here specifically because an embed page
     * has nothing to steal: it is a prerendered calculator with no session, no
     * cookie, no stored data and no privileged action a clickjacked click
     * could trigger. `connect-src 'self'` still holds, so a framed tool cannot
     * send anything anywhere.
     */
    'frame-ancestors': embeddable ? '*' : `'none'`,
    'frame-src': `'none'`,
    'manifest-src': `'self'`,
    'media-src': `'self' blob:`,
  };

  const serialized = Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');

  /*
   * `upgrade-insecure-requests` only makes sense when the canonical origin is
   * actually HTTPS. Emitting it unconditionally breaks any plain-HTTP
   * deployment — including a self-hosted one behind a TLS-terminating proxy
   * that is addressed over HTTP, and the local production server the
   * cross-browser tests run against, where WebKit dutifully upgraded every
   * asset request and the page never loaded.
   */
  const upgradeInsecure = !isDev && siteUrl.startsWith('https://');

  return upgradeInsecure ? `${serialized}; upgrade-insecure-requests` : serialized;
}

/**
 * All security response headers, including the CSP.
 *
 * Applied by `next.config.ts` rather than by the proxy, so they reach every
 * response — including statically served files — and so the policy survives a
 * static-export deployment (spec §13.2).
 */
export function securityHeaders(options: { embeddable?: boolean } = {}): HeaderEntry[] {
  const { embeddable = false } = options;
  const isDev = process.env.NODE_ENV !== 'production';

  const headers: HeaderEntry[] = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDev, embeddable) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    /*
     * Omitted on embed routes. `X-Frame-Options` has no "any origin" value —
     * the header only expresses DENY or SAMEORIGIN — and a browser enforces
     * whichever of it and `frame-ancestors` is stricter, so sending it at all
     * would silently defeat the permissive CSP above.
     */
    ...(embeddable ? [] : [{ key: 'X-Frame-Options', value: 'DENY' }]),
    {
      key: 'Permissions-Policy',
      // Nothing in the product needs these capabilities.
      value: [
        'accelerometer=()',
        'autoplay=()',
        'camera=()',
        'display-capture=()',
        'encrypted-media=()',
        'geolocation=()',
        'gyroscope=()',
        'idle-detection=()',
        'magnetometer=()',
        'microphone=()',
        'midi=()',
        'payment=()',
        'usb=()',
        'interest-cohort=()',
      ].join(', '),
    },
    // Same reasoning: `same-origin` severs the embed from its framing page.
    ...(embeddable ? [] : [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin' as const }]),
    { key: 'X-DNS-Prefetch-Control', value: 'off' },
  ];

  if (!isDev) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}
