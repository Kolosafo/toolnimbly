import { absoluteUrl, site } from '@/lib/config/site';
import type { ToolContent } from '@/content/types';
import type { CategoryDefinition, ToolDefinition } from '@/lib/registry/types';

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
export function toolApplicationSchema(tool: ToolDefinition, content: ToolContent): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${absoluteUrl(`/tools/${tool.slug}`)}#app`,
    name: tool.name,
    url: absoluteUrl(`/tools/${tool.slug}`),
    description: tool.description,
    applicationCategory: 'UtilitiesApplication',
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
export function faqSchema(content: ToolContent): JsonLdObject {
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
