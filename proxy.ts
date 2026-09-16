import { NextResponse, type NextRequest } from 'next/server';

import { isIndexable } from '@/lib/config/site';

/**
 * Adds an unconditional `noindex` header on every non-production deployment
 * (spec §8.1), belt-and-braces alongside the `robots.txt` disallow.
 *
 * Security headers and the CSP are applied in `next.config.ts` instead, so they
 * cover static assets too and survive a static-export deployment. This file
 * deliberately does not issue a CSP nonce: every page here is prerendered at
 * build time, so a per-request nonce can never reach the HTML (ADR 0006).
 *
 * Next.js 16 renamed this file convention from `middleware` to `proxy`.
 */
export function proxy(_request: NextRequest) {
  const response = NextResponse.next();

  if (!isIndexable) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Documents only. Static assets do not need the robots header and would
     * only add per-asset overhead.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|txt|xml|webmanifest)$).*)',
  ],
};
