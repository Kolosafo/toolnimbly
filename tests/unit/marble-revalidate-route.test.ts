import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Exercise the real route, signature verification and event dispatch. Only
// Next's cache side effects need a substitute outside a running Next server.
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }));

const SECRET = 'whsec_route_test_secret';
const SLUG = 'percentage-points-vs-percent';

// Marble's documented JSON envelope uses `type`, not `event`:
// https://docs.marblecms.com/features/webhooks#request-payload
function postEnvelope(type = 'post.published') {
  return {
    id: 'evt_test_publication',
    type,
    createdAt: '2026-10-19T17:04:54.000Z',
    workspaceId: 'org_test_workspace',
    resource: { type: 'post', id: 'post_test_percentage' },
    actor: { type: 'api_key', id: 'key_test_writer' },
    data: {
      id: 'post_test_percentage',
      title: 'Percentage Points vs Percent',
      slug: SLUG,
      description: 'Understand the difference with worked examples.',
      coverImage: null,
      status: 'published',
      featured: false,
      categoryId: 'cat_test_math',
      primaryAuthorId: 'author_test',
      publishedAt: '2026-10-19T17:04:54.000Z',
      createdAt: '2026-10-19T16:00:00.000Z',
      updatedAt: '2026-10-19T17:04:54.000Z',
    },
  };
}

function sign(body: string, secret = SECRET): string {
  return `sha256=${createHmac('sha256', secret).update(body, 'utf8').digest('hex')}`;
}

function request(body: string, signature: string | null = sign(body)): Request {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature !== null) headers.set('x-marble-signature', signature);
  return new Request('https://www.toolnimbly.com/api/revalidate', {
    method: 'POST',
    headers,
    body,
  });
}

function expectNoInvalidation() {
  expect(revalidatePath).not.toHaveBeenCalled();
  expect(revalidateTag).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv('NEXT_PUBLIC_BLOG_ENABLED', 'true');
  vi.stubEnv('MARBLE_WEBHOOK_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/revalidate', () => {
  it.each(['post.published', 'post.updated', 'post.unpublished', 'post.deleted'])(
    'refreshes all post surfaces for a signed Marble %s envelope',
    async (type) => {
      const { POST } = await import('@/app/api/revalidate/route');
      const body = JSON.stringify(postEnvelope(type), null, 2);

      const response = await POST(request(body));

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ revalidated: true });
      expect(revalidatePath).toHaveBeenCalledTimes(3);
      expect(revalidatePath).toHaveBeenCalledWith('/blog');
      expect(revalidatePath).toHaveBeenCalledWith(`/blog/${SLUG}`);
      expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
      expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('marble:posts', { expire: 0 });
    },
  );

  it('refreshes the inventory and sitemap when an otherwise valid post event has no slug', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const payload = { ...postEnvelope(), data: { id: 'post_test_percentage' } };

    const response = await POST(request(JSON.stringify(payload)));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ revalidated: true });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
    expect(revalidatePath).toHaveBeenCalledWith('/blog');
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml');
    expect(revalidateTag).toHaveBeenCalledExactlyOnceWith('marble:posts', { expire: 0 });
  });

  it.each(['tag.created', 'postscript.updated'])(
    'ignores signed unrelated event %s',
    async (type) => {
      const { POST } = await import('@/app/api/revalidate/route');
      const payload = {
        ...postEnvelope(type),
        resource: { type: 'tag', id: 'tag_test' },
        data: { id: 'tag_test', name: 'Math', slug: 'math' },
      };

      const response = await POST(request(JSON.stringify(payload)));

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ revalidated: false });
      expectNoInvalidation();
    },
  );

  it('rejects an invalid signature before parsing or invalidating', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const body = JSON.stringify(postEnvelope());

    const response = await POST(request(body, sign(body, 'wrong-secret')));

    expect(response.status).toBe(401);
    expectNoInvalidation();
  });

  it('rejects a body changed after signing', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const body = JSON.stringify(postEnvelope());

    const response = await POST(request(body.replace(SLUG, 'different-post'), sign(body)));

    expect(response.status).toBe(401);
    expectNoInvalidation();
  });

  it('rejects a missing signature', async () => {
    const { POST } = await import('@/app/api/revalidate/route');

    const response = await POST(request(JSON.stringify(postEnvelope()), null));

    expect(response.status).toBe(401);
    expectNoInvalidation();
  });

  it('rejects requests when the signing secret is unset', async () => {
    vi.stubEnv('MARBLE_WEBHOOK_SECRET', undefined);
    const { POST } = await import('@/app/api/revalidate/route');

    const response = await POST(request(JSON.stringify(postEnvelope())));

    expect(response.status).toBe(401);
    expectNoInvalidation();
  });

  it('returns 404 without invalidating when the blog is disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_BLOG_ENABLED', 'false');
    const { POST } = await import('@/app/api/revalidate/route');

    const response = await POST(request(JSON.stringify(postEnvelope())));

    expect(response.status).toBe(404);
    expectNoInvalidation();
  });

  it('rejects correctly signed malformed JSON', async () => {
    const { POST } = await import('@/app/api/revalidate/route');

    const response = await POST(request('{"type":"post.published","data":'));

    expect(response.status).toBe(400);
    expectNoInvalidation();
  });

  it.each([
    { label: 'null payload', payload: null },
    { label: 'array payload', payload: [] },
    { label: 'string payload', payload: 'post.published' },
    { label: 'legacy event-only envelope', payload: { event: 'post.published', data: {} } },
    { label: 'missing type', payload: { data: {} } },
    { label: 'empty type', payload: { type: '', data: {} } },
    { label: 'null type', payload: { type: null, data: {} } },
    { label: 'numeric type', payload: { type: 1, data: {} } },
    { label: 'array type', payload: { type: ['post.published'], data: {} } },
    { label: 'missing data', payload: { type: 'post.published' } },
    { label: 'null data', payload: { type: 'post.published', data: null } },
    { label: 'array data', payload: { type: 'post.published', data: [] } },
    { label: 'string data', payload: { type: 'post.published', data: 'post' } },
    { label: 'numeric data', payload: { type: 'post.published', data: 1 } },
    { label: 'null slug', payload: { type: 'post.published', data: { slug: null } } },
    { label: 'numeric slug', payload: { type: 'post.published', data: { slug: 1 } } },
    { label: 'array slug', payload: { type: 'post.published', data: { slug: ['post'] } } },
    { label: 'object slug', payload: { type: 'post.published', data: { slug: {} } } },
  ])('rejects signed $label without invalidation', async ({ payload }) => {
    const { POST } = await import('@/app/api/revalidate/route');

    const response = await POST(request(JSON.stringify(payload)));

    expect(response.status).toBe(400);
    expectNoInvalidation();
  });
});
