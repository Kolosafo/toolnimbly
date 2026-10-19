import type { Post } from '@usemarble/sdk/models';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Keep the real SDK and its response validation/iterator. Only the network and
// Next's import guard are replaced, so a changed HTTP contract cannot turn this
// suite green merely because a hand-written SDK mock accepts the wrong shape.
vi.mock('server-only', () => ({}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('MARBLE_API_KEY', 'marble-test-key');
  vi.stubEnv('NEXT_PUBLIC_BLOG_ENABLED', 'true');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function makePost(index: number): Post {
  return {
    id: `post-${index}`,
    slug: `salary-to-hourly-${index}`,
    title: `Salary to Hourly Example ${index}`,
    description: `Calculate the hourly pay for salary example ${index}.`,
    status: 'published',
    featured: false,
    coverImage: null,
    publishedAt: new Date('2026-09-20T10:00:00.000Z'),
    updatedAt: new Date('2026-10-19T10:00:00.000Z'),
    authors: [],
    category: { id: 'calculators', name: 'Calculators', slug: 'calculators', description: null },
    tags: [],
    fields: {
      relatedToolSlug: 'salary-calculator',
      relatedGuideSlug: 'how-to-convert-salary-to-hourly',
    },
    content: `<p>A complete worked calculation for example ${index}.</p>`,
  };
}

function requestUrl(input: RequestInfo | URL): URL {
  return new URL(input instanceof Request ? input.url : String(input));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// This is the public /v1/posts HTTP shape, including nullable first/last page
// links. The SDK converts wire-format ISO dates back to Date instances.
function inventoryResponse(input: RequestInfo | URL, posts: Post[]): Response {
  const url = requestUrl(input);
  const limit = Number(url.searchParams.get('limit'));
  const currentPage = Number(url.searchParams.get('page') ?? '1');
  const totalPages = Math.max(1, Math.ceil(posts.length / limit));
  return jsonResponse({
    posts: posts.slice((currentPage - 1) * limit, currentPage * limit),
    pagination: {
      limit,
      currentPage,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      previousPage: currentPage > 1 ? currentPage - 1 : null,
      totalPages,
      totalItems: posts.length,
    },
  });
}

describe('Marble published inventory', () => {
  it('returns every post across pages for an inventory larger than 100', async () => {
    const inventory = Array.from({ length: 120 }, (_, index) => makePost(index + 1));
    fetchMock.mockImplementation(async (input) => inventoryResponse(input, inventory));
    const { listAllPosts } = await import('@/lib/marble/posts');

    const posts = await listAllPosts();

    expect(posts.map((post) => post.id)).toEqual(inventory.map((post) => post.id));
    expect(posts[119]?.publishedAt).toEqual(new Date('2026-09-20T10:00:00.000Z'));
    expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
    const urls = fetchMock.mock.calls.map(([input]) => requestUrl(input));
    expect(urls.map((url) => Number(url.searchParams.get('page') ?? '1'))).toEqual(
      Array.from({ length: urls.length }, (_, index) => index + 1),
    );
    for (const url of urls) {
      expect(url.pathname).toBe('/v1/posts');
      expect(url.searchParams.get('status')).toBe('published');
      expect(url.searchParams.get('excludeCategories')).toBe('legal');
    }
  });

  it('allows an explicitly empty successful inventory', async () => {
    fetchMock.mockImplementation(async (input) => inventoryResponse(input, []));
    const { listAllPosts } = await import('@/lib/marble/posts');

    await expect(listAllPosts()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a later-page failure instead of publishing an empty or partial inventory', async () => {
    const inventory = Array.from({ length: 120 }, (_, index) => makePost(index + 1));
    fetchMock.mockImplementation(async (input) =>
      requestUrl(input).searchParams.get('page') === '2'
        ? jsonResponse({ error: 'Unavailable', message: 'CMS unavailable' }, 503)
        : inventoryResponse(input, inventory),
    );
    const { listAllPosts } = await import('@/lib/marble/posts');

    await expect(listAllPosts()).rejects.toBeInstanceOf(Error);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid successful response rather than silently dropping the inventory', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ posts: [], pagination: { totalPages: 1 } }));
    const { listAllPosts } = await import('@/lib/marble/posts');

    await expect(listAllPosts()).rejects.toBeInstanceOf(Error);
  });

  it('keeps a locally rejected draft out of the returned inventory', async () => {
    const published = makePost(1);
    const draft: Post = { ...makePost(2), status: 'draft' };
    fetchMock.mockImplementation(async (input) => inventoryResponse(input, [published, draft]));
    const { listAllPosts } = await import('@/lib/marble/posts');

    await expect(listAllPosts()).resolves.toEqual([published]);
  });
});

describe.each(['listAllPosts', 'getPost'] as const)('Marble %s failures', (operation) => {
  it.each([401, 429, 500, 503])(
    'propagates HTTP %s instead of treating it as absent content',
    async (status) => {
      fetchMock.mockResolvedValue(
        jsonResponse({ error: 'Request failed', message: 'CMS unavailable' }, status),
      );
      const posts = await import('@/lib/marble/posts');

      await expect(posts[operation]('salary-to-hourly-1')).rejects.toBeInstanceOf(Error);
    },
  );

  it('propagates network failures', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network unavailable'));
    const posts = await import('@/lib/marble/posts');

    await expect(posts[operation]('salary-to-hourly-1')).rejects.toBeInstanceOf(Error);
  });
});

describe('Marble single post', () => {
  it('loads a published post through the real SDK response parser', async () => {
    const post = makePost(1);
    fetchMock.mockResolvedValue(jsonResponse({ post }));
    const { getPost } = await import('@/lib/marble/posts');

    await expect(getPost(post.slug)).resolves.toEqual(post);
    const url = requestUrl(fetchMock.mock.calls[0]![0]);
    expect(url.pathname).toBe(`/v1/posts/${post.slug}`);
    expect(url.searchParams.get('status')).toBe('published');
  });

  it('returns null for a real CMS 404', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: 'Not found', message: 'Post not found' }, 404),
    );
    const { getPost } = await import('@/lib/marble/posts');

    await expect(getPost('missing-post')).resolves.toBeNull();
  });

  it('rejects malformed successful responses instead of creating a false 404', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ post: null }));
    const { getPost } = await import('@/lib/marble/posts');

    await expect(getPost('salary-to-hourly-1')).rejects.toBeInstanceOf(Error);
  });
});

it('does not initialize the client or call the CMS while the blog is disabled', async () => {
  vi.stubEnv('NEXT_PUBLIC_BLOG_ENABLED', 'false');
  vi.stubEnv('MARBLE_API_KEY', undefined);
  const { listAllPosts, getPost } = await import('@/lib/marble/posts');

  await expect(listAllPosts()).resolves.toEqual([]);
  await expect(getPost('salary-to-hourly-1')).resolves.toBeNull();
  expect(fetchMock).not.toHaveBeenCalled();
});
