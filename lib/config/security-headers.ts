/**
 * Security headers and Content Security Policy (spec §7.9, ADR 0006).
 *
 * The policy is static-compatible: it carries no nonce, because every page in
 * this product is prerendered at build time and a nonce must vary per request.
 * See ADR 0006 for the full reasoning and the compensating controls.
 */

export type HeaderEntry = { key: string; value: string };

/**
 * Build the Content Security Policy.
 *
 * Notes on the directives that are not obvious:
 * - `script-src 'self'` is the substantive control: no third-party script can
 *   load, because no other origin is listed. The product embeds no third-party
 *   scripts at all, so this costs nothing.
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
 * - `connect-src 'self'` is the directive that enforces the product's core
 *   promise: no tool payload can be sent to any other origin, because no other
 *   origin is reachable.
 */
export function buildContentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = isDev
    ? // Next.js dev tooling (HMR, React Refresh) requires eval.
      `'self' 'unsafe-eval' 'unsafe-inline' blob:`
    : `'self' 'unsafe-inline' 'wasm-unsafe-eval'`;

  const directives: Record<string, string> = {
    'default-src': `'self'`,
    'script-src': scriptSrc,
    // Next.js injects the critical stylesheet inline and the style attribute is
    // used for chart geometry. Styles cannot exfiltrate data on their own, and
    // `connect-src` blocks outbound requests regardless.
    'style-src': `'self' 'unsafe-inline'`,
    'img-src': `'self' data: blob:`,
    'font-src': `'self' data:`,
    'connect-src': isDev ? `'self' ws: wss:` : `'self' blob: data:`,
    'worker-src': `'self' blob:`,
    'child-src': `'self' blob:`,
    'object-src': `'none'`,
    'base-uri': `'self'`,
    'form-action': `'self'`,
    'frame-ancestors': `'none'`,
    'frame-src': `'none'`,
    'manifest-src': `'self'`,
    'media-src': `'self' blob:`,
  };

  const serialized = Object.entries(directives)
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');

  return isDev ? serialized : `${serialized}; upgrade-insecure-requests`;
}

/**
 * All security response headers, including the CSP.
 *
 * Applied by `next.config.ts` rather than by the proxy, so they reach every
 * response — including statically served files — and so the policy survives a
 * static-export deployment (spec §13.2).
 */
export function securityHeaders(): HeaderEntry[] {
  const isDev = process.env.NODE_ENV !== 'production';

  const headers: HeaderEntry[] = [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDev) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
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
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
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
