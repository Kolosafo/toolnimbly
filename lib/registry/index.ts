import { categories, getCategory } from './categories';
import { tools } from './tools';
import type { CategoryDefinition, ToolCategory, ToolDefinition } from './types';

export * from './types';
export { categories, getCategory, findCategory, categoryPath, adjacentCategories } from './categories';
export { tools, EXPECTED_TOOL_COUNT } from './tools';

const toolBySlug = new Map<string, ToolDefinition>(tools.map((tool) => [tool.slug, tool]));

/** Every canonical tool slug, in registry order. */
export const toolSlugs: readonly string[] = tools.map((tool) => tool.slug);

export function findTool(slug: string): ToolDefinition | undefined {
  return toolBySlug.get(slug);
}

export function getTool(slug: string): ToolDefinition {
  const tool = toolBySlug.get(slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

/** Canonical path for a tool page. */
export function toolPath(slug: string): string {
  return `/tools/${slug}`;
}

export function toolsInCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((tool) => tool.category === category);
}

/** Curated popular tools for the homepage, sourced from registry flags only. */
export function featuredTools(): ToolDefinition[] {
  return tools.filter((tool) => tool.featured);
}

/**
 * The related tools for a page, resolved and de-duplicated. Curated in the
 * registry — never generated from traffic (spec §5.2).
 */
export function relatedTools(slug: string): ToolDefinition[] {
  const tool = findTool(slug);
  if (!tool) return [];
  const seen = new Set<string>([slug]);
  const resolved: ToolDefinition[] = [];
  for (const relatedSlug of tool.relatedSlugs) {
    if (seen.has(relatedSlug)) continue;
    const related = toolBySlug.get(relatedSlug);
    if (!related) continue;
    seen.add(relatedSlug);
    resolved.push(related);
  }
  return resolved;
}

/** Most recently reviewed tools, newest first. Used by the homepage. */
export function recentlyUpdatedTools(limit = 6): ToolDefinition[] {
  return [...tools]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : a.name.localeCompare(b.name)))
    .slice(0, limit);
}

export function categoryOf(tool: ToolDefinition): CategoryDefinition {
  return getCategory(tool.category);
}

/** Categories ordered for navigation. */
export function orderedCategories(): CategoryDefinition[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

/**
 * Every indexable route on the site, used by the sitemap and by the link
 * integrity test (spec §8.4).
 */
export function allIndexableRoutes(): string[] {
  return [
    '/',
    ...orderedCategories().map((category) => `/${category.slug}`),
    ...toolSlugs.map(toolPath),
    '/about',
    '/privacy',
    '/terms',
    '/contact',
  ];
}
