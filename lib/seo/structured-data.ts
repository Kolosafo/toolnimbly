import { absoluteUrl, site } from '@/lib/config/site';
import type { ContentFaq, ToolContent } from '@/content/types';
import type { GuideDefinition } from '@/lib/registry/guides';
import type { CategoryDefinition, ToolCategory, ToolDefinition } from '@/lib/registry/types';

/**
 * JSON-LD builders (spec §8.2).
 *
 * Only properties that are accurate are emitted. There are no aggregate
 * ratings, prices, review counts or publisher claims, because none of those
 * exist for this product.
 */

type JsonLdObject = Record<string, unknown>;

export function websiteSchema(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: 'en',
    publisher: { '@id': `${site.url}/#organization` },
  };
}

export function organizationSchema(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    description: site.description,
    email: site.contactEmail,
  };
}

export type BreadcrumbEntry = { name: string; path: string };

export function breadcrumbSchema(entries: readonly BreadcrumbEntry[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: absoluteUrl(entry.path),
    })),
  };
}

/**
 * A tool page is a browser application that runs without payment and without an
 * account. `offers` with a zero price is the accurate way to state that.
 */
/**
 * schema.org's own `applicationCategory` values, mapped from our categories.
 *
 * Every tool previously declared `UtilitiesApplication`, which is true of a
 * word counter and misleading of a mortgage calculator. The vocabulary has
 * specific values for finance and health, and using them is how a rich result
 * ends up in the right context rather than in a generic bucket.
 *
 * The health tools are the reason this is a per-tool lookup and not a
 * per-category one: BMI and calorie calculators sit in `calculators` beside the
 * loan tools but are `HealthApplication`.
 */
const HEALTH_TOOLS = new Set(['bmi-calculator', 'calorie-calculator']);

const CATEGORY_APPLICATION_TYPE: Record<ToolCategory, string> = {
  calculators: 'FinanceApplication',
  'text-developer-tools': 'DeveloperApplication',
  'image-tools': 'MultimediaApplication',
  'pdf-tools': 'BusinessApplication',
  'business-tools': 'BusinessApplication',
};

function applicationCategory(tool: ToolDefinition): string {
  if (HEALTH_TOOLS.has(tool.slug)) return 'HealthApplication';
  // Not every calculator is financial: age and percentage are general-purpose.
  if (tool.slug === 'age-calculator' || tool.slug === 'percentage-calculator') {
    return 'UtilitiesApplication';
  }
  if (tool.slug === 'date-difference-calculator') return 'UtilitiesApplication';
  return CATEGORY_APPLICATION_TYPE[tool.category];
}

export function toolApplicationSchema(tool: ToolDefinition, content: ToolContent): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${absoluteUrl(`/tools/${tool.slug}`)}#app`,
    name: tool.name,
    url: absoluteUrl(`/tools/${tool.slug}`),
    description: tool.description,
    applicationCategory: applicationCategory(tool),
    operatingSystem: 'Any modern web browser',
    browserRequirements: 'Requires JavaScript. No installation or account needed.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: content.steps.map((step) => step.title),
    inLanguage: 'en',
    publisher: { '@id': `${site.url}/#organization` },
  };
}

/**
 * FAQ schema is emitted only from the FAQs that are visibly rendered on the
 * same page, and the text matches exactly (spec §8.2).
 */
export function faqSchema(content: { readonly faqs: readonly ContentFaq[] }): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function categoryCollectionSchema(
  category: CategoryDefinition,
  categoryTools: readonly ToolDefinition[],
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(`/${category.slug}`)}#collection`,
    name: category.name,
    url: absoluteUrl(`/${category.slug}`),
    description: category.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${site.url}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoryTools.length,
      itemListElement: categoryTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.name,
        url: absoluteUrl(`/tools/${tool.slug}`),
      })),
    },
  };
}

/**
 * A supporting article (SEO brief §5).
 *
 * `Article` rather than `WebApplication`: these pages explain a subject and
 * have no interactive panel, and describing them as software would be a false
 * signal. The publisher is the same organisation node the tool pages reference,
 * so the graph stays connected.
 */
export function guideArticleSchema(guide: GuideDefinition): JsonLdObject {
  const url = absoluteUrl(`/guides/${guide.slug}`);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: guide.name,
    description: guide.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    // No fabricated publication date: `updatedAt` is the date the text was last
    // reviewed, which is the only date we can state truthfully.
    dateModified: guide.updatedAt,
    datePublished: guide.updatedAt,
    author: { '@id': `${site.url}/#organization` },
    publisher: { '@id': `${site.url}/#organization` },
  };
}

/**
 * The aggregate dataset behind the research report (SEO brief §8.2).
 *
 * Emitted only when the aggregate CSV is genuinely downloadable from the
 * public origin, and carrying only properties we can substantiate. There is no
 * DOI, no citation count, no named author beyond the publishing organisation,
 * and no `spatialCoverage`: respondents self-selected, so a geographic claim
 * would describe who happened to answer rather than anywhere the data covers.
 */
export function datasetSchema(input: {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly datePublished: string;
  readonly dateModified: string;
  /** ISO 8601 interval, e.g. `2026-07-06/2026-07-29`. */
  readonly temporalCoverage: string;
  readonly contentUrl: string;
  readonly usageInfo: string;
  readonly variableMeasured: readonly string[];
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${input.url}#dataset`,
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: 'en',
    isAccessibleForFree: true,
    creator: { '@id': `${site.url}/#organization` },
    publisher: { '@id': `${site.url}/#organization` },
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    temporalCoverage: input.temporalCoverage,
    usageInfo: input.usageInfo,
    variableMeasured: input.variableMeasured,
    distribution: [
      {
        '@type': 'DataDownload',
        encodingFormat: 'text/csv',
        contentUrl: input.contentUrl,
      },
    ],
  };
}
