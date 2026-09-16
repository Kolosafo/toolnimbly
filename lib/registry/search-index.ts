import { categories } from './categories';
import { tools } from './tools';

/**
 * Compact client-side search index.
 *
 * Only the fields the search UI renders are included, which keeps the payload
 * shipped to the browser small — roughly a few kilobytes for all 30 tools.
 */
export type SearchEntry = {
  slug: string;
  name: string;
  description: string;
  category: string;
  categoryName: string;
  icon: string;
  /** Lowercased haystack, precomputed at build time. */
  haystack: string;
};

const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));

export const searchIndex: readonly SearchEntry[] = tools.map((tool) => {
  const categoryName = categoryNames.get(tool.category) ?? tool.category;
  return {
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    categoryName,
    icon: tool.icon,
    haystack: [
      tool.name,
      tool.shortName,
      tool.slug.replace(/-/g, ' '),
      tool.primaryKeyword,
      tool.description,
      categoryName,
    ]
      .join(' ')
      .toLowerCase(),
  };
});

/**
 * Ranks matches so an exact or prefix hit on the tool name always outranks an
 * incidental match inside a description.
 */
export function searchTools(query: string, limit = 8): SearchEntry[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const terms = trimmed.split(/\s+/).filter(Boolean);

  const scored = searchIndex
    .map((entry) => {
      const name = entry.name.toLowerCase();
      let score = 0;

      for (const term of terms) {
        if (!entry.haystack.includes(term)) return null;
        if (name === term) score += 100;
        else if (name.startsWith(term)) score += 50;
        else if (name.includes(term)) score += 25;
        else if (entry.slug.includes(term)) score += 15;
        else score += 5;
      }

      // Shorter names win ties, so "Word Counter" beats "Character Counter"
      // for the query "counter" only when the query genuinely matches better.
      return { entry, score: score - entry.name.length * 0.01 };
    })
    .filter((result): result is { entry: SearchEntry; score: number } => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((result) => result.entry);
}
