// @vitest-environment jsdom

import type { Post } from '@usemarble/sdk/models';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { BlogIndex } from '@/components/blog/blog-index';
import { BlogPost } from '@/components/blog/blog-post';
import { site } from '@/lib/config/site';
import {
  assertPublishedPostSet,
  blogPostSchema,
  blogPostSitemapEntries,
  buildBlogPostMetadata,
} from '@/lib/marble/seo';

const post: Post = {
  id: 'post-1',
  slug: 'salary-to-hourly-explained',
  title: 'Salary to Hourly Pay Explained',
  status: 'published',
  featured: false,
  coverImage: null,
  description: 'Learn how working hours and paid weeks turn an annual salary into hourly pay.',
  publishedAt: new Date('2026-01-10T09:30:00.000Z'),
  updatedAt: new Date('2026-02-14T15:45:00.000Z'),
  authors: [],
  category: {
    id: 'category-1',
    name: 'Calculators',
    slug: 'calculators',
    description: null,
  },
  tags: [],
  fields: {
    relatedToolSlug: 'salary-calculator',
    relatedGuideSlug: 'how-to-convert-salary-to-hourly',
    coverImageAlt: 'A payslip beside an hourly wage calculation',
  },
  content:
    '<h1>A pasted CMS heading</h1><p>The CMS article body is present before JavaScript runs.</p>',
};

describe('blog index SEO', () => {
  it('renders exactly one breadcrumb graph and no article schema', () => {
    const document = renderDocument(<BlogIndex posts={[post]} />);
    const types = jsonLdTypes(document);

    // Regression: BlogIndex once added a second BreadcrumbList after the
    // Breadcrumbs component had already emitted one.
    expect(types.filter((type) => type === 'BreadcrumbList')).toHaveLength(1);
    expect(types.filter((type) => type === 'BlogPosting')).toHaveLength(0);
    expect(types.filter((type) => type === 'Article')).toHaveLength(0);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')?.textContent).toBe('Blog');
    expect(breadcrumbLabels(document)).toEqual(['Home', 'Blog']);
  });
});

describe('published blog post SEO', () => {
  it('server-renders the article body, dates, authorship, breadcrumbs and contextual links', () => {
    const document = renderDocument(<BlogPost post={post} />);
    const types = jsonLdTypes(document);

    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(document.querySelector('h1')?.textContent).toBe(post.title);
    expect(document.querySelector('h2')?.textContent).toBe('A pasted CMS heading');
    expect(document.body.textContent).toContain(
      'The CMS article body is present before JavaScript runs.',
    );
    expect(document.body.textContent).toContain('Published 10 January 2026');
    expect(document.body.textContent).toContain('Updated 14 February 2026');
    expect(document.querySelector('a[rel="author"]')?.getAttribute('href')).toBe(
      '/about#how-the-content-is-written-and-reviewed',
    );
    expect(document.querySelector('a[href="/tools/salary-calculator"]')).toBeTruthy();
    expect(
      document.querySelector('a[href="/guides/how-to-convert-salary-to-hourly"]'),
    ).toBeTruthy();

    expect(types.filter((type) => type === 'BreadcrumbList')).toHaveLength(1);
    expect(types.filter((type) => type === 'BlogPosting')).toHaveLength(1);
    expect(types.filter((type) => type === 'Article')).toHaveLength(0);
    expect(breadcrumbLabels(document)).toEqual(['Home', 'Blog', post.title]);
  });

  it('builds a clean canonical, robots meta and complete absolute social metadata', () => {
    const metadata = buildBlogPostMetadata(post);
    const canonical = `${site.url}/blog/${post.slug}`;

    expect(metadata.title).toEqual({ absolute: `${post.title} | ${site.name}` });
    expect(metadata.description).toBe(post.description);
    expect(metadata.alternates?.canonical).toBe(canonical);
    expect(metadata.robots).toBeDefined();
    expect(String(metadata.alternates?.canonical)).not.toContain('?');
    expect(metadata.openGraph).toMatchObject({
      type: 'article',
      url: canonical,
      title: `${post.title} | ${site.name}`,
      description: post.description,
      publishedTime: '2026-01-10T09:30:00.000Z',
      modifiedTime: '2026-02-14T15:45:00.000Z',
      authors: [site.name],
      images: [
        {
          url: `${site.url}/opengraph-image`,
          alt: 'A payslip beside an hourly wage calculation',
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({
      title: `${post.title} | ${site.name}`,
      description: post.description,
      images: [
        {
          url: `${site.url}/opengraph-image`,
          alt: 'A payslip beside an hourly wage calculation',
        },
      ],
    });
  });

  it('uses CMS dates and the ToolNimbly organization in BlogPosting JSON-LD', () => {
    expect(blogPostSchema(post)).toMatchObject({
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: '2026-01-10T09:30:00.000Z',
      dateModified: '2026-02-14T15:45:00.000Z',
      author: {
        '@type': 'Organization',
        '@id': `${site.url}/#organization`,
        name: site.name,
      },
      publisher: { '@id': `${site.url}/#organization` },
      image: {
        url: `${site.url}/opengraph-image`,
        caption: 'A payslip beside an hourly wage calculation',
      },
    });
  });

  it('adds only published canonical posts to the sitemap with CMS lastmod', () => {
    const draft: Post = {
      ...post,
      id: 'draft-1',
      slug: 'draft-preview',
      status: 'draft',
    };
    const entries = blogPostSitemapEntries([post, draft]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.url).toBe(`${site.url}/blog/${post.slug}`);
    expect(entries[0]?.lastModified).toEqual(new Date('2026-02-14T15:45:00.000Z'));
    expect(entries[0]?.url).not.toMatch(/[?&](utm_|ref=)|\/preview|\/admin|\/search/);
  });

  it('rejects duplicate published titles and descriptions', () => {
    expect(() =>
      assertPublishedPostSet([
        post,
        {
          ...post,
          id: 'post-2',
          slug: 'second-canonical-slug',
        },
      ]),
    ).toThrow(/duplicate title/i);

    expect(() =>
      assertPublishedPostSet([
        post,
        {
          ...post,
          id: 'post-3',
          slug: 'third-canonical-slug',
          title: 'A Different Article Title',
        },
      ]),
    ).toThrow(/duplicate meta description/i);
  });
});

function renderDocument(node: React.ReactNode): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(node), 'text/html');
}

function breadcrumbLabels(document: Document): string[] {
  return [...document.querySelectorAll('nav[aria-label="Breadcrumb"] li')].map(
    (item) => item.textContent?.trim() ?? '',
  );
}

function jsonLdTypes(document: Document): string[] {
  const types: string[] = [];

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== 'object') return;

    const object = value as Record<string, unknown>;
    if (typeof object['@type'] === 'string') types.push(object['@type']);
    Object.values(object).forEach(visit);
  }

  for (const element of document.querySelectorAll('script[type="application/ld+json"]')) {
    visit(JSON.parse(element.textContent ?? 'null') as unknown);
  }

  return types;
}
