/**
 * The embed snippet (SEO brief §7).
 *
 * The point of this feature is the backlink, and the backlink is *not* the
 * credit link rendered inside the embed page. A link inside our own iframe
 * points from our domain to our domain — an internal link, worth nothing, and
 * in any case iframe content is not attributed to the framing page.
 *
 * The link that counts is the plain `<a href>` the snippet places **below** the
 * iframe, in the host site's own HTML. That is why the snippet is a static
 * string a person pastes, with no JavaScript: a link injected by script is not
 * reliably crawled, and the whole mechanism would earn nothing.
 */

import { absoluteUrl } from '@/lib/config/site';
import type { ToolCategory, ToolDefinition } from '@/lib/registry/types';

/**
 * Default iframe heights, in CSS pixels.
 *
 * An iframe cannot size itself to its content across origins, and the snippet
 * carries no script to negotiate a height, so these are fixed and chosen to fit
 * the tallest ordinary state of each kind of tool without leaving a large empty
 * band underneath. People can edit the number; most will not, so the default
 * has to be right.
 */
const CATEGORY_HEIGHTS: Record<ToolCategory, number> = {
  calculators: 620,
  'text-developer-tools': 560,
  'image-tools': 640,
  'pdf-tools': 640,
  'business-tools': 900,
};

/** Tools whose ordinary state is materially taller or shorter than its category. */
const HEIGHT_OVERRIDES: Record<string, number> = {
  // Amortisation and projection tables push these well past a stock calculator.
  'loan-calculator': 760,
  'mortgage-calculator': 820,
  'compound-interest-calculator': 780,
  // A result is a handful of lines.
  'date-difference-calculator': 520,
  'character-counter': 480,
  'uuid-generator': 520,
  // Preview canvases need the room.
  'image-cropper': 760,
  'pdf-to-jpg': 720,
};

export function embedHeight(tool: ToolDefinition): number {
  return HEIGHT_OVERRIDES[tool.slug] ?? CATEGORY_HEIGHTS[tool.category];
}

export function embedPath(slug: string): string {
  return `/embed/${slug}`;
}

export type EmbedTheme = 'auto' | 'light' | 'dark';

/**
 * Build the paste-ready snippet.
 *
 * Kept deliberately plain: no classes, no inline styles beyond what is needed
 * to stop the iframe adding a border and to keep it responsive, and no script.
 * It has to survive being pasted into a CMS that strips attributes it does not
 * recognise, and it has to be readable enough that whoever pastes it trusts it.
 */
export function buildEmbedSnippet(tool: ToolDefinition, theme: EmbedTheme = 'auto'): string {
  const src = absoluteUrl(embedPath(tool.slug)) + (theme === 'auto' ? '' : `?theme=${theme}`);
  const canonical = absoluteUrl(`/tools/${tool.slug}`);
  const height = embedHeight(tool);

  return [
    `<iframe src="${src}"`,
    `        title="${tool.name}"`,
    `        width="100%" height="${height}"`,
    `        style="border:1px solid #e2e5ea;border-radius:12px;max-width:100%"`,
    `        loading="lazy"></iframe>`,
    `<p style="font:14px system-ui,sans-serif;margin:8px 0 0">`,
    `  Powered by <a href="${canonical}">${tool.name}</a> from ToolNimbly`,
    `</p>`,
  ].join('\n');
}
