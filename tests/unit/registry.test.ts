import { describe, expect, it } from 'vitest';

import { toolContent } from '@/content';
import {
  allIndexableRoutes,
  categories,
  EXPECTED_TOOL_COUNT,
  featuredTools,
  guidePath,
  guides,
  orderedCategories,
  relatedTools,
  toolPath,
  tools,
  toolsInCategory,
} from '@/lib/registry';
import {
  collectRegistryIssues,
  guidePageWordCount,
  toolPageWordCount,
} from '@/lib/registry/validate';

describe('tool registry invariants', () => {
  it('satisfies every declared invariant', () => {
    const issues = collectRegistryIssues();
    expect(
      issues.map((issue) => `[${issue.scope}] ${issue.message}`),
      'registry invariant violations',
    ).toEqual([]);
  });

  it('contains exactly the contracted number of launch tools', () => {
    expect(tools).toHaveLength(EXPECTED_TOOL_COUNT);
  });

  it('has a content module for every tool and no orphan modules', () => {
    const registrySlugs = new Set(tools.map((tool) => tool.slug));
    const contentSlugs = new Set(Object.keys(toolContent));
    expect([...registrySlugs].filter((slug) => !contentSlugs.has(slug))).toEqual([]);
    expect([...contentSlugs].filter((slug) => !registrySlugs.has(slug))).toEqual([]);
  });

  it('ships 800–1,500 words of useful, crawlable content on every tool page', () => {
    for (const tool of tools) {
      const words = toolPageWordCount(tool.slug);
      expect(words, `${tool.slug} is too thin`).toBeGreaterThanOrEqual(800);
      expect(words, `${tool.slug} is too long`).toBeLessThanOrEqual(1_500);
    }
  });

  it('keeps the four priority guides within the requested useful range', () => {
    for (const slug of [
      'what-a-payment-receipt-should-include',
      'compound-interest-with-contributions',
      'how-to-convert-salary-to-hourly',
      'how-extra-loan-payments-save-interest',
    ]) {
      const words = guidePageWordCount(slug);
      expect(words, `${slug} is too thin`).toBeGreaterThanOrEqual(700);
      expect(words, `${slug} is too long`).toBeLessThanOrEqual(1_400);
    }
  });

  it('resolves 3 to 6 related tools for every route, never itself', () => {
    for (const tool of tools) {
      const related = relatedTools(tool.slug);
      expect(related.length, `${tool.slug} related count`).toBeGreaterThanOrEqual(3);
      expect(related.length, `${tool.slug} related count`).toBeLessThanOrEqual(6);
      expect(related.map((r) => r.slug)).not.toContain(tool.slug);
    }
  });

  it('places every tool in exactly one category, and every category has tools', () => {
    const total = categories.reduce((sum, c) => sum + toolsInCategory(c.slug).length, 0);
    expect(total).toBe(tools.length);
    for (const category of categories) {
      expect(toolsInCategory(category.slug).length, category.slug).toBeGreaterThan(0);
    }
  });

  it('has no orphan tool routes — every tool is reachable from its category', () => {
    const reachable = new Set(
      orderedCategories().flatMap((category) => toolsInCategory(category.slug).map((t) => t.slug)),
    );
    for (const tool of tools) {
      expect(reachable.has(tool.slug), `${tool.slug} unreachable from navigation`).toBe(true);
    }
  });

  it('lists every indexable route exactly once', () => {
    const routes = allIndexableRoutes();
    expect(new Set(routes).size).toBe(routes.length);
    for (const tool of tools) {
      expect(routes).toContain(toolPath(tool.slug));
    }
    for (const category of categories) {
      expect(routes).toContain(`/${category.slug}`);
    }
    for (const guide of guides) {
      expect(routes).toContain(guidePath(guide.slug));
    }

    /*
     * Derived rather than hard-coded. The point of this assertion is that
     * nothing is listed twice and nothing extra has crept in, not that the site
     * has a particular number of pages — a literal here has to be edited every
     * time a page is added, which teaches people to edit it without looking.
     */
    const fixedPages = ['/', '/guides', '/about', '/privacy', '/terms', '/contact'];
    expect(routes).toHaveLength(
      fixedPages.length + categories.length + tools.length + guides.length,
    );
    for (const page of fixedPages) {
      expect(routes).toContain(page);
    }
  });

  it('curates a sensible featured set drawn from more than one category', () => {
    const featured = featuredTools();
    expect(featured.length).toBeGreaterThanOrEqual(4);
    expect(new Set(featured.map((tool) => tool.category)).size).toBeGreaterThanOrEqual(3);
  });

  it('gives every tool a unique title and description', () => {
    expect(new Set(tools.map((t) => t.title)).size).toBe(tools.length);
    expect(new Set(tools.map((t) => t.description)).size).toBe(tools.length);
  });
});
