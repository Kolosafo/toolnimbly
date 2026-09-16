import { describe, expect, it } from 'vitest';

import { toolContent } from '@/content';
import {
  allIndexableRoutes,
  categories,
  EXPECTED_TOOL_COUNT,
  featuredTools,
  orderedCategories,
  relatedTools,
  toolPath,
  tools,
  toolsInCategory,
} from '@/lib/registry';
import { collectRegistryIssues } from '@/lib/registry/validate';

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
    // 1 home + 5 categories + 30 tools + 4 legal/editorial pages
    expect(routes).toHaveLength(40);
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
