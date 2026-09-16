/**
 * Security headers and Content Security Policy (spec §7.9).
 *
 * The CSP is nonce-based and carries no `unsafe-eval` in production. It is
 * applied per-request by `middleware.ts` so each response gets a fresh nonce;
 * the remaining static headers are applied by `next.config.ts`.
 */

export type HeaderEntry = { key: string; value: string };

/**
 * Static response headers. These are safe to apply to every route including
 * static assets.
 */
export function securityHeaders(): HeaderEntry[] {
  const headers: HeaderEntry[] = [
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

  if (process.env.NODE_ENV === 'production') {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }

  return headers;
}

/**
 * Build the Content Security Policy for one response.
 *
 * Notes on the directives that are not obvious:
 * - `wasm-unsafe-eval` is required by pdf.js, which compiles WebAssembly for
 *   image decoding. It permits WebAssembly compilation only, not `eval`.
 * - `worker-src blob:` is required because the image and PDF workers are
 *   instantiated from bundled blob URLs.
 * - `img-src blob: data:` covers canvas previews and generated thumbnails.
 * - `connect-src 'self'` is deliberate: no tool payload ever leaves the device,
 *   so no third-party endpoint is allowed by default.
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? // Next.js dev tooling (HMR, React Refresh) requires eval.
      `'self' 'unsafe-eval' 'unsafe-inline' blob:`
    : `'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' blob:`;

  const directives: Record<string, string> = {
    'default-src': `'self'`,
    'script-src': scriptSrc,
    // Next.js injects the critical stylesheet inline; a hash set is not stable
    // across builds, so styles keep 'unsafe-inline'. Styles cannot exfiltrate
    // tool data on their own and `connect-src` blocks outbound requests.
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

  return process.env.NODE_ENV === 'production'
    ? `${serialized}; upgrade-insecure-requests`
    : serialized;
}
