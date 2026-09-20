/**
 * Marble webhook verification and handling (docs/marble-integration.md §10).
 *
 * This is what makes "publish in Marble, live in seconds" work without a
 * redeploy. It is also an unauthenticated public endpoint, so the signature
 * check is the only thing standing between the CMS and anyone who can POST.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

import { revalidatePath, revalidateTag } from 'next/cache';

import { MARBLE_CACHE_TAG } from './cache-tag';

/** Header Marble signs the request body with. */
export const SIGNATURE_HEADER = 'x-marble-signature';

export type MarbleWebhookPayload = {
  event: string;
  data: { id?: string; slug?: string; title?: string; userId?: string };
};

/**
 * Verify the HMAC-SHA256 signature over the raw request body.
 *
 * The body must be the exact bytes received. Parsing the JSON and
 * re-serialising it changes whitespace and key order, which changes the digest
 * and rejects every legitimate request — so the caller reads `request.text()`
 * and verifies before `JSON.parse`.
 *
 * Comparison is constant-time. A plain `===` on the hex strings leaks, through
 * timing, how many leading characters of a guess were correct, which is enough
 * to forge a signature byte by byte.
 */
export function verifySignature(
  secret: string,
  signatureHeader: string,
  bodyText: string,
): boolean {
  const providedHex = signatureHeader.replace(/^sha256=/, '').trim();

  // `Buffer.from` silently truncates on invalid hex, which would make a
  // malformed signature compare against a short buffer rather than fail.
  if (!/^[0-9a-f]+$/i.test(providedHex) || providedHex.length % 2 !== 0) return false;

  const provided = Buffer.from(providedHex, 'hex');
  const computed = createHmac('sha256', secret).update(bodyText, 'utf8').digest();

  if (provided.length !== computed.length) return false;
  return timingSafeEqual(provided, computed);
}

export type WebhookResult = {
  revalidated: boolean;
  now: number;
  message: string;
};

/**
 * Act on a verified event.
 *
 * Belt and braces: the two specific routes are revalidated by path, and
 * everything the SDK fetched is invalidated by tag — which covers the sitemap
 * and any other list that happens to include posts. Only `post.*` events are
 * handled; tag, category and media events are acknowledged and ignored,
 * because nothing on this site renders them.
 */
export async function handleWebhookEvent(
  payload: MarbleWebhookPayload,
): Promise<WebhookResult> {
  if (!payload.event.startsWith('post')) {
    return { revalidated: false, now: Date.now(), message: `Ignored event ${payload.event}` };
  }

  revalidatePath('/blog');
  if (payload.data.slug) revalidatePath(`/blog/${payload.data.slug}`);
  /*
   * Next.js 16 requires a cache profile alongside the tag. `expire: 0` forces
   * immediate expiry rather than serving stale-while-revalidate, which is the
   * point of a publish webhook: the editor wants to see the change now, not on
   * the next background refresh.
   */
  revalidateTag(MARBLE_CACHE_TAG, { expire: 0 });
  // The sitemap lists post URLs, so a publish or a deletion changes it.
  revalidatePath('/sitemap.xml');

  return { revalidated: true, now: Date.now(), message: `Handled ${payload.event}` };
}
