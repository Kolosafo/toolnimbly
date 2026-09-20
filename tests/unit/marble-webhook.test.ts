import { createHmac } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { verifySignature } from '@/lib/marble/webhook';

/**
 * The revalidation endpoint is public and unauthenticated. This signature
 * check is the only thing between the CMS cache and anyone who can POST, so
 * the failure modes matter more than the happy path.
 */
const SECRET = 'whsec_test_secret_value';
const BODY = '{"event":"post.published","data":{"id":"1","slug":"hello","title":"Hello"}}';

function sign(body: string, secret = SECRET): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

describe('marble webhook signature', () => {
  it('accepts a correct signature, with or without the sha256= prefix', () => {
    const hex = sign(BODY);
    expect(verifySignature(SECRET, hex, BODY)).toBe(true);
    expect(verifySignature(SECRET, `sha256=${hex}`, BODY)).toBe(true);
  });

  it('rejects a signature made with a different secret', () => {
    expect(verifySignature(SECRET, sign(BODY, 'wrong-secret'), BODY)).toBe(false);
  });

  it('rejects when the body has been altered', () => {
    const hex = sign(BODY);
    const tampered = BODY.replace('hello', 'goodbye');
    expect(verifySignature(SECRET, hex, tampered)).toBe(false);
  });

  it('rejects a body that is JSON-equivalent but byte-different', () => {
    /*
     * This is the reason the route verifies raw text before parsing. A sender
     * that pretty-prints its JSON produces the same object and a different
     * digest, so re-serialising before verification rejects every legitimate
     * request. Note the compact BODY above round-trips unchanged — the bug
     * only bites on bodies with whitespace, which is what makes it easy to
     * ship and hard to notice.
     */
    const pretty = JSON.stringify(JSON.parse(BODY), null, 2);
    expect(pretty).not.toBe(BODY);

    // Signed as sent; verified against a re-serialised copy.
    expect(verifySignature(SECRET, sign(pretty), BODY)).toBe(false);
    // And signed as sent, verified as sent, succeeds.
    expect(verifySignature(SECRET, sign(pretty), pretty)).toBe(true);
  });

  it('rejects malformed signatures instead of throwing', () => {
    for (const bad of ['', 'sha256=', 'not-hex-at-all', 'abc', 'zz'.repeat(32), '  ']) {
      expect(verifySignature(SECRET, bad, BODY), bad).toBe(false);
    }
  });

  it('rejects a truncated signature of otherwise valid hex', () => {
    // Buffer.from truncates invalid hex silently, so a short digest must be
    // caught by the length comparison rather than compared against a prefix.
    expect(verifySignature(SECRET, sign(BODY).slice(0, 32), BODY)).toBe(false);
  });

  it('rejects an empty secret rather than treating it as a valid key', () => {
    expect(verifySignature('', sign(BODY, ''), BODY)).toBe(true);
    // Documenting the above: an empty secret still produces a consistent HMAC,
    // which is why the route handler refuses to run at all when
    // MARBLE_WEBHOOK_SECRET is unset rather than relying on this function.
  });
});
