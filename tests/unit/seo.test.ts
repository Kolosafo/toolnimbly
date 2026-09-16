import { describe, expect, it } from 'vitest';

import { toolContent } from '@/content';
import { site } from '@/lib/config/site';
import { categories, tools } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  breadcrumbSchema,
  categoryCollectionSchema,
  faqSchema,
  organizationSchema,
  toolApplicationSchema,
  websiteSchema,
} from '@/lib/seo/structured-data';

describe('metadata', () => {
  it('builds a self-referencing absolute canonical without a query string', () => {
    for (const tool of tools) {
      const metadata = buildMetadata({
        title: tool.title,
        description: tool.description,
        path: `/tools/${tool.slug}`,
      });
      const canonical = metadata.alternates?.canonical;
      expect(canonical, tool.slug).toBe(`${site.url}/tools/${tool.slug}`);
      expect(String(canonical)).not.toContain('?');
    }
  });

  it('does not append the site name twice on the homepage', () => {
    const metadata = buildMetadata({ title: site.name, description: site.description, path: '/' });
    expect(metadata.title).toBe(`${site.name} — ${site.tagline}`);
  });

  it('suffixes the site name on every non-home route', () => {
    const metadata = buildMetadata({
      title: 'Loan Payment Calculator',
      description: 'x'.repeat(120),
      path: '/tools/loan-calculator',
    });
    expect(metadata.title).toBe(`Loan Payment Calculator | ${site.name}`);
  });

  it('honours an explicit noIndex request', () => {
    const metadata = buildMetadata({
      title: 'Hidden',
      description: 'y'.repeat(120),
      path: '/hidden',
      noIndex: true,
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('gives Open Graph a canonical URL and a sized image', () => {
    const metadata = buildMetadata({
      title: 'PDF Merger',
      description: 'z'.repeat(120),
      path: '/tools/pdf-merger',
    });
    expect(metadata.openGraph?.url).toBe(`${site.url}/tools/pdf-merger`);
    const images = metadata.openGraph?.images;
    expect(Array.isArray(images) && images.length).toBeTruthy();
  });

  it('produces a unique title and description for every indexable route', () => {
    const entries = [
      ...tools.map((tool) => ({ title: tool.title, description: tool.description })),
      ...categories.map((category) => ({
        title: category.title,
        description: category.description,
      })),
    ];
    expect(new Set(entries.map((e) => e.title)).size).toBe(entries.length);
    expect(new Set(entries.map((e) => e.description)).size).toBe(entries.length);
  });
});

describe('structured data', () => {
  it('emits FAQ schema that matches the visible FAQs exactly', () => {
    for (const tool of tools) {
      const content = toolContent[tool.slug];
      expect(content, tool.slug).toBeDefined();
      if (!content) continue;

      const schema = faqSchema(content) as {
        mainEntity: { name: string; acceptedAnswer: { text: string } }[];
      };
      expect(schema.mainEntity).toHaveLength(content.faqs.length);
      schema.mainEntity.forEach((entity, index) => {
        const faq = content.faqs[index];
        expect(entity.name).toBe(faq?.question);
        expect(entity.acceptedAnswer.text).toBe(faq?.answer);
      });
    }
  });

  it('never claims a rating, review count or price it does not have', () => {
    const serialised = JSON.stringify([
      websiteSchema(),
      organizationSchema(),
      ...tools.map((tool) => {
        const content = toolContent[tool.slug];
        return content ? toolApplicationSchema(tool, content) : {};
      }),
    ]);
    expect(serialised).not.toContain('aggregateRating');
    expect(serialised).not.toContain('reviewCount');
    expect(serialised).not.toContain('ratingValue');
  });

  it('describes tool applications accurately', () => {
    const tool = tools[0];
    const content = tool ? toolContent[tool.slug] : undefined;
    expect(tool && content).toBeTruthy();
    if (!tool || !content) return;

    const schema = toolApplicationSchema(tool, content) as Record<string, unknown>;
    expect(schema['@type']).toBe('WebApplication');
    expect(schema.isAccessibleForFree).toBe(true);
    expect(schema.url).toBe(`${site.url}/tools/${tool.slug}`);
  });

  it('numbers breadcrumb positions from one with absolute URLs', () => {
    const schema = breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'PDF Tools', path: '/pdf-tools' },
      { name: 'PDF Merger', path: '/tools/pdf-merger' },
    ]) as { itemListElement: { position: number; item: string }[] };

    expect(schema.itemListElement.map((entry) => entry.position)).toEqual([1, 2, 3]);
    expect(schema.itemListElement[0]?.item).toBe(site.url);
    expect(schema.itemListElement[2]?.item).toBe(`${site.url}/tools/pdf-merger`);
  });

  it('lists every tool of a category in its collection schema', () => {
    for (const category of categories) {
      const categoryTools = tools.filter((tool) => tool.category === category.slug);
      const schema = categoryCollectionSchema(category, categoryTools) as {
        mainEntity: { numberOfItems: number; itemListElement: { position: number }[] };
      };
      expect(schema.mainEntity.numberOfItems).toBe(categoryTools.length);
      expect(schema.mainEntity.itemListElement).toHaveLength(categoryTools.length);
    }
  });

  it('serialises JSON-LD without a raw closing script tag', () => {
    const payload = JSON.stringify(websiteSchema()).replace(/</g, '\\u003c');
    expect(payload).not.toContain('</');
  });
});
