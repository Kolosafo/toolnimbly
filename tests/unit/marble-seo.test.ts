import type { Post } from '@usemarble/sdk/models';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { site } from '@/lib/config/site';
import {
  assertPublishedPostSeoReady,
  assertPublishedPostSet,
  relatedBlogContent,
} from '@/lib/marble/seo';
import { guidesForTool } from '@/lib/registry';

afterEach(() => {
  vi.unstubAllEnvs();
});

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'published-post',
    slug: 'quarterly-vs-semiannual-compounding-formula',
    title: 'Quarterly vs Semiannual Compounding Formula',
    description: 'Compare quarterly and semiannual schedules using worked examples.',
    status: 'published',
    featured: false,
    coverImage: null,
    publishedAt: new Date('2026-09-20T10:00:00.000Z'),
    updatedAt: new Date('2026-10-19T10:00:00.000Z'),
    authors: [],
    category: { id: 'education', name: 'Education', slug: 'education', description: null },
    tags: [],
    fields: {},
    content: '<p>An explanation with worked examples.</p>',
    ...overrides,
  };
}

describe('published article relationships from existing body links', () => {
  it.each([
    {
      slug: 'quarterly-vs-semiannual-compounding-formula',
      title: 'Quarterly vs Semiannual Compounding Formula',
      toolSlug: 'compound-interest-calculator',
    },
    {
      slug: 'cycle-billing-explained-how-to-stagger-customer-invoices',
      title: 'Cycle Billing Explained: How to Stagger Customer Invoices',
      toolSlug: 'invoice-generator',
    },
  ])(
    'keeps $slug SEO-ready when its body links to a registered tool',
    ({ slug, title, toolSlug }) => {
      const post = makePost({
        slug,
        title,
        content: `<p>Try the <a href="/tools/${toolSlug}">related tool</a>.</p>`,
      });

      expect(relatedBlogContent(post)?.tool.slug).toBe(toolSlug);
      expect(relatedBlogContent(post)?.guide.slug).toBe(guidesForTool(toolSlug)[0]?.slug);
      expect(() => assertPublishedPostSeoReady(post)).not.toThrow();
      expect(() => assertPublishedPostSet([post])).not.toThrow();
    },
  );

  it('accepts a same-origin absolute tool link with a query and fragment', () => {
    const post = makePost({
      content: `<p><a href='${site.url}/tools/compound-interest-calculator?example=quarterly#result'>Try it</a>.</p>`,
    });

    expect(relatedBlogContent(post)?.tool.slug).toBe('compound-interest-calculator');
    expect(() => assertPublishedPostSeoReady(post)).not.toThrow();
  });

  it('resolves existing production links while running with a local site origin', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
    vi.resetModules();
    const localSeo = await import('@/lib/marble/seo');
    const post = makePost({
      content:
        '<p><a href="https://www.toolnimbly.com/tools/compound-interest-calculator">Try it</a>.</p>',
    });

    expect(localSeo.relatedBlogContent(post)?.tool.slug).toBe('compound-interest-calculator');
    expect(() => localSeo.assertPublishedPostSeoReady(post)).not.toThrow();
  });

  it('keeps explicit editorial relationships ahead of body links', () => {
    const post = makePost({
      fields: {
        relatedToolSlug: 'salary-calculator',
        relatedGuideSlug: 'how-to-convert-salary-to-hourly',
      },
      content: '<p><a href="/tools/compound-interest-calculator">Try it</a>.</p>',
    });

    expect(relatedBlogContent(post)?.tool.slug).toBe('salary-calculator');
    expect(relatedBlogContent(post)?.guide.slug).toBe('how-to-convert-salary-to-hourly');
  });

  it.each([
    'https://untrusted.example/tools/compound-interest-calculator',
    '//untrusted.example/tools/compound-interest-calculator',
    `https://${new URL(site.url).hostname}.untrusted.example/tools/compound-interest-calculator`,
    '/tools/not-a-registered-tool',
  ])('does not accept %s as an internal editorial relationship', (href) => {
    const post = makePost({ content: `<p><a href="${href}">Try it</a>.</p>` });

    expect(relatedBlogContent(post)).toBeNull();
    expect(() => assertPublishedPostSeoReady(post)).toThrow(/relatedToolSlug/);
  });

  it('does not relax required SEO content when a usable body link exists', () => {
    const post = makePost({
      title: '',
      content: '<p><a href="/tools/compound-interest-calculator">Try it</a>.</p>',
    });

    expect(() => assertPublishedPostSeoReady(post)).toThrow(/title is empty/);
  });
});
