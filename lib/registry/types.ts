/**
 * Registry types (spec §7.3).
 *
 * One entry per canonical route. The registry is the single source of truth for
 * navigation, metadata, the sitemap, related links and `generateStaticParams`.
 */

export const TOOL_CATEGORIES = [
  'calculators',
  'text-developer-tools',
  'image-tools',
  'pdf-tools',
  'business-tools',
] as const;

export type ToolCategory = (typeof TOOL_CATEGORIES)[number];

export type CategoryDefinition = {
  /** Category slug; also its route segment at the site root. */
  readonly slug: ToolCategory;
  /** Display name used in navigation and breadcrumbs. */
  readonly name: string;
  /** Shorter label for tight navigation contexts. */
  readonly shortName: string;
  /** `<title>` for the category page. */
  readonly title: string;
  /** Meta description for the category page. */
  readonly description: string;
  /** Page H1. */
  readonly heading: string;
  /** Opening paragraph, unique per category (spec §5.1). */
  readonly intro: string;
  /** Guidance on choosing between the tools in this category. */
  readonly selectionGuidance: readonly string[];
  /** Contextual links for the category's highest-intent user jobs. */
  readonly contextualLinks?: readonly {
    readonly label: string;
    readonly description: string;
    readonly href: string;
  }[];
  /** Lucide icon name. */
  readonly icon: string;
  /** Order in navigation. */
  readonly order: number;
};

export type ToolDefinition = {
  /** URL segment under `/tools/`. Never changes without a permanent redirect. */
  readonly slug: string;
  /** Full display name, used as the page H1. */
  readonly name: string;
  /** Compact name for cards, breadcrumbs and navigation. */
  readonly shortName: string;
  readonly category: ToolCategory;
  /** Meta description and card summary. 110–165 characters. */
  readonly description: string;
  /** `<title>` content, excluding the site-name suffix. 20–60 characters. */
  readonly title: string;
  /** The single search intent this route serves. Used for review, not stuffing. */
  readonly primaryKeyword: string;
  /** Three to six genuinely adjacent tools (spec §5.2). */
  readonly relatedSlugs: readonly string[];
  /** Lucide icon name. */
  readonly icon: string;
  /** True when all processing happens on the device. Drives the privacy badge. */
  readonly localProcessing: boolean;
  /** Surfaced in the homepage popular-tools section. */
  readonly featured: boolean;
  /** Key into the lazy client-component map. Unique across the registry. */
  readonly componentKey: string;
  /** ISO date of the last substantive review of this tool and its content. */
  readonly updatedAt: string;
};

export type ToolSlug = string;
