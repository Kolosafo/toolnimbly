import { NextResponse, type NextRequest } from 'next/server';

import { buildContentSecurityPolicy } from '@/lib/config/security-headers';
import { isIndexable } from '@/lib/config/site';

/**
 * Attaches a per-request nonce-based Content Security Policy and, on non-
 * production deployments, an unconditional `noindex` header (spec §8.1).
 *
 * Next.js 16 renamed this file convention from `middleware` to `proxy`.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV !== 'production';
  const csp = buildContentSecurityPolicy(nonce, isDev);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);

  if (!isIndexable) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except Next.js internals and static files, which do not need
     * a document CSP and would only add per-asset overhead.
     */
    {
      source: '/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|txt|xml|webmanifest)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
