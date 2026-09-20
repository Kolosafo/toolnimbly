/**
 * The Next.js cache tag applied to every Marble response.
 *
 * It lives in its own module, free of `server-only` and of the SDK, so that
 * the webhook's signature verification — a pure crypto function — can be unit
 * tested without pulling a server-only API client into the test runner.
 */
export const MARBLE_CACHE_TAG = 'marble:posts';
