import { z } from 'zod';

import { toolContent } from '@/content';
import { guideContents } from '@/content/guides';
import { toolDeepDives } from '@/content/tool-deep-dives';
import { site } from '@/lib/config/site';

import { categories } from './categories';
import { EXPECTED_GUIDE_COUNT, guides } from './guides';
import { EXPECTED_TOOL_COUNT, tools } from './tools';
import { TOOL_CATEGORIES } from './types';

/**
 * Registry invariants (spec §7.3).
 *
 * These run as a unit test on every CI run and, in development, at module load
 * so a broken registry surfaces the moment a page is opened rather than at
 * launch. Keeping them in one place means adding a tool is a mechanical,
 * verifiable change.
 */

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

const toolSchema = z.object({
  slug: z.string().regex(slugPattern, 'slug must be lowercase kebab-case'),
  name: z.string().min(3).max(60),
  shortName: z.string().min(2).max(30),
  category: z.enum(TOOL_CATEGORIES),
  // Kept within the range search engines typically render without truncation.
  description: z.string().min(110).max(170),
  title: z.string().min(12).max(60),
  primaryKeyword: z.string().min(3).max(60),
  relatedSlugs: z.array(z.string()).min(3).max(6),
  icon: z.string().min(2),
  localProcessing: z.boolean(),
  featured: z.boolean(),
  componentKey: z.string().min(3),
  updatedAt: z.string().regex(isoDatePattern, 'updatedAt must be an ISO date'),
});

const categorySchema = z.object({
  slug: z.enum(TOOL_CATEGORIES),
  name: z.string().min(3).max(40),
  shortName: z.string().min(2).max(24),
  title: z.string().min(12).max(60),
  description: z.string().min(110).max(170),
  heading: z.string().min(3).max(60),
  intro: z.string().min(180),
  selectionGuidance: z.array(z.string().min(40)).min(3),
  contextualLinks: z
    .array(
      z.object({
        label: z.string().min(12),
        description: z.string().min(50),
        href: z.string().startsWith('/tools/'),
      }),
    )
    .optional(),
  icon: z.string().min(2),
  order: z.number().int().positive(),
});

export type RegistryIssue = { scope: string; message: string };

function countWords(value: unknown, key = ''): number {
  if (key === 'slug' || key === 'url') return 0;
  if (typeof value === 'string') {
    return value.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  }
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countWords(item), 0);
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce(
      (total, [entryKey, item]) => total + countWords(item, entryKey),
      0,
    );
  }
  return 0;
}

/** Approximate the words a crawler and reader receive around one tool. */
export function toolPageWordCount(slug: string): number {
  const content = toolContent[slug];
  const deepDive = toolDeepDives[slug];
  if (!content || !deepDive) return 0;
  return countWords(content) + countWords(deepDive);
}

/** Approximate the visible words in a supporting guide. */
export function guidePageWordCount(slug: string): number {
  const content = guideContents.find((guide) => guide.slug === slug);
  return content ? countWords(content) : 0;
}

/** Returns every invariant violation. An empty array means the registry is sound. */
export function collectRegistryIssues(): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const add = (scope: string, message: string) => issues.push({ scope, message });

  // --- Shape ---------------------------------------------------------------
  for (const tool of tools) {
    const parsed = toolSchema.safeParse(tool);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        add(tool.slug, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
    }
  }

  for (const category of categories) {
    const parsed = categorySchema.safeParse(category);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        add(category.slug, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
    }
  }

  // --- Counts --------------------------------------------------------------
  if (tools.length !== EXPECTED_TOOL_COUNT) {
    add('registry', `expected exactly ${EXPECTED_TOOL_COUNT} tools, found ${tools.length}`);
  }
  if (categories.length !== TOOL_CATEGORIES.length) {
    add('registry', `expected ${TOOL_CATEGORIES.length} categories, found ${categories.length}`);
  }

  // --- Uniqueness ----------------------------------------------------------
  const seenSlugs = new Set<string>();
  const seenComponentKeys = new Set<string>();
  const seenTitles = new Set<string>();
  const seenDescriptions = new Set<string>();

  for (const tool of tools) {
    if (seenSlugs.has(tool.slug)) add(tool.slug, 'duplicate slug');
    seenSlugs.add(tool.slug);

    if (seenComponentKeys.has(tool.componentKey)) {
      add(tool.slug, `duplicate componentKey "${tool.componentKey}"`);
    }
    seenComponentKeys.add(tool.componentKey);

    const titleKey = tool.title.toLowerCase();
    if (seenTitles.has(titleKey)) add(tool.slug, `duplicate title "${tool.title}"`);
    seenTitles.add(titleKey);

    const descriptionKey = tool.description.toLowerCase();
    if (seenDescriptions.has(descriptionKey)) add(tool.slug, 'duplicate description');
    seenDescriptions.add(descriptionKey);

    const renderedTitle = `${tool.title} | ${site.name}`;
    if (renderedTitle.length > 70) {
      add(tool.slug, `rendered title is ${renderedTitle.length} characters`);
    }

    const keyword = tool.primaryKeyword.toLowerCase();
    if (!tool.name.toLowerCase().includes(keyword) && !tool.title.toLowerCase().includes(keyword)) {
      add(tool.slug, `neither H1 nor title contains primary keyword "${tool.primaryKeyword}"`);
    }
  }

  const categoryOrders = new Set<number>();
  for (const category of categories) {
    if (categoryOrders.has(category.order)) add(category.slug, `duplicate order ${category.order}`);
    categoryOrders.add(category.order);
  }

  // --- Referential integrity ----------------------------------------------
  for (const tool of tools) {
    if (!TOOL_CATEGORIES.includes(tool.category)) {
      add(tool.slug, `unknown category "${tool.category}"`);
    }

    const relatedSeen = new Set<string>();
    for (const related of tool.relatedSlugs) {
      if (related === tool.slug) add(tool.slug, 'relatedSlugs points at itself');
      if (relatedSeen.has(related)) add(tool.slug, `duplicate related slug "${related}"`);
      relatedSeen.add(related);
      if (!seenSlugs.has(related)) add(tool.slug, `related slug "${related}" does not exist`);
    }
  }

  // --- Every category has tools, every tool has a content module -----------
  for (const category of categories) {
    const count = tools.filter((tool) => tool.category === category.slug).length;
    if (count === 0) add(category.slug, 'category contains no tools');
  }

  for (const tool of tools) {
    const content = toolContent[tool.slug];
    if (!content) {
      add(tool.slug, 'no content module — production cannot ship a tool without reviewed content');
      continue;
    }
    if (content.slug !== tool.slug) {
      add(tool.slug, `content module declares slug "${content.slug}"`);
    }

    const introWords = content.intro.trim().split(/\s+/).length;
    if (introWords < 40 || introWords > 110) {
      add(tool.slug, `intro is ${introWords} words; expected 40–110`);
    }
    if (content.steps.length < 3 || content.steps.length > 5) {
      add(tool.slug, `expected 3–5 steps, found ${content.steps.length}`);
    }
    if (content.faqs.length < 4 || content.faqs.length > 6) {
      add(tool.slug, `expected 4–6 FAQs, found ${content.faqs.length}`);
    }
    if (content.limitations.length < 2) {
      add(tool.slug, 'expected at least two stated limitations');
    }
    if (!content.privacyNote.trim()) add(tool.slug, 'missing privacy note');

    const faqQuestions = new Set<string>();
    for (const faq of content.faqs) {
      const key = faq.question.trim().toLowerCase();
      if (faqQuestions.has(key)) add(tool.slug, `duplicate FAQ question "${faq.question}"`);
      faqQuestions.add(key);
      if (faq.answer.trim().length < 80) {
        add(tool.slug, `FAQ answer too thin: "${faq.question}"`);
      }
    }

    if (!toolDeepDives[tool.slug]) {
      add(tool.slug, 'missing the explanatory deep-dive section');
    } else {
      const pageWords = toolPageWordCount(tool.slug);
      if (pageWords < 800 || pageWords > 1500) {
        add(tool.slug, `page content is ${pageWords} words; expected 800–1,500`);
      }
    }
  }

  // --- No orphan content ---------------------------------------------------
  for (const slug of Object.keys(toolContent)) {
    if (!seenSlugs.has(slug)) add(slug, 'content module has no registry entry');
  }
  for (const slug of Object.keys(toolDeepDives)) {
    if (!seenSlugs.has(slug)) add(slug, 'deep-dive content has no registry entry');
  }

  // --- Featured tools ------------------------------------------------------
  const featuredCount = tools.filter((tool) => tool.featured).length;
  if (featuredCount < 4 || featuredCount > 10) {
    add('registry', `expected 4–10 featured tools, found ${featuredCount}`);
  }

  return issues;
}

/** Throws with every issue listed. Used by the test suite and dev-time checks. */
/**
 * Guide invariants, checked alongside the tool registry so a broken article
 * fails `next build` rather than shipping. The rules mirror the tool rules:
 * one content module per entry, no dangling links, metadata within the same
 * length limits the tool pages use.
 */
function collectGuideIssues(): RegistryIssue[] {
  const issues: RegistryIssue[] = [];
  const add = (message: string) => issues.push({ scope: 'guides', message });

  if (guides.length !== EXPECTED_GUIDE_COUNT) {
    add(`expected ${EXPECTED_GUIDE_COUNT} guides, found ${guides.length}`);
  }

  const toolSlugs = new Set(tools.map((tool) => tool.slug));
  const contentSlugs = new Set(guideContents.map((guide) => guide.slug));
  const seen = new Set<string>();

  for (const guide of guides) {
    if (seen.has(guide.slug)) add(`duplicate slug "${guide.slug}"`);
    seen.add(guide.slug);

    if (!contentSlugs.has(guide.slug)) add(`"${guide.slug}" has no content module`);
    if (guide.title.length > 60) add(`"${guide.slug}" title is ${guide.title.length} characters`);
    if (guide.description.length < 110 || guide.description.length > 165) {
      add(`"${guide.slug}" description is ${guide.description.length} characters`);
    }
    if (guide.relatedToolSlugs.length < 3) {
      add(`"${guide.slug}" links to fewer than three tools`);
    }
    for (const slug of guide.relatedToolSlugs) {
      if (!toolSlugs.has(slug)) add(`"${guide.slug}" links to unknown tool "${slug}"`);
    }
  }

  for (const content of guideContents) {
    if (!seen.has(content.slug)) add(`content module "${content.slug}" has no registry entry`);
    const words = countWords(content);
    if (words < 800 || words > 1800) {
      add(`"${content.slug}" article is ${words} words; expected 800–1,800`);
    }
    if (
      [
        'what-a-payment-receipt-should-include',
        'compound-interest-with-contributions',
        'how-to-convert-salary-to-hourly',
        'how-extra-loan-payments-save-interest',
      ].includes(content.slug) &&
      (words < 700 || words > 1400)
    ) {
      add(`"${content.slug}" article is ${words} words; expected 700–1,400 for this brief`);
    }
  }

  return issues;
}

export function assertRegistryValid(): void {
  const issues = [...collectRegistryIssues(), ...collectGuideIssues()];
  if (issues.length === 0) return;
  const detail = issues.map((issue) => `  • [${issue.scope}] ${issue.message}`).join('\n');
  throw new Error(`Registry failed validation:\n${detail}`);
}
