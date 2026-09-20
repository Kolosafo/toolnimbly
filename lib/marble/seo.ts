import type { Metadata, MetadataRoute } from 'next';
import type { Post } from '@usemarble/sdk/models';

import { absoluteUrl, site } from '@/lib/config/site';
import {
  findGuide,
  findTool,
  guides,
  guidesForTool,
  tools,
  type GuideDefinition,
  type ToolDefinition,
} from '@/lib/registry';
import { buildMetadata, DEFAULT_OG_IMAGE } from '@/lib/seo/metadata';

export const BLOG_AUTHOR_PATH = '/about#how-the-content-is-written-and-reviewed';

export type RelatedBlogContent = {
  tool: ToolDefinition;
  guide: GuideDefinition;
};

/** Marble can return drafts unless a status filter is supplied. Keep a second guard here. */
export function isPublishedPost(post: Post): boolean {
  return post.status === 'published';
}

export function blogPostPath(post: Pick<Post, 'slug'>): string {
  return `/blog/${post.slug}`;
}

export function blogPostDescription(post: Pick<Post, 'title' | 'description'>): string {
  const description = post.description.trim();
  if (description) return description;

  return `Read ${post.title.trim()} on ToolNimbly, with a clear explanation and links to the relevant free tool and supporting guide.`;
}

export function blogPostImageUrl(post: Pick<Post, 'coverImage'>): string {
  const image = post.coverImage?.trim() || DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith('//')) return `https:${image}`;
  return absoluteUrl(image.startsWith('/') ? image : `/${image}`);
}

export function blogPostImageAlt(post: Pick<Post, 'title' | 'fields'>): string {
  for (const key of ['coverImageAlt', 'cover_image_alt']) {
    const value = post.fields?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return `${post.title.trim()} — ToolNimbly article cover`;
}

export function blogPostDates(post: Pick<Post, 'publishedAt' | 'updatedAt'>): {
  published: Date;
  modified: Date;
  wasUpdated: boolean;
} {
  const published = validDate(post.publishedAt, 'publishedAt');
  const modified = validDate(post.updatedAt, 'updatedAt');

  return {
    published,
    modified,
    wasUpdated: modified.getTime() > published.getTime(),
  };
}

/**
 * Resolve the two editorial links each published post must carry.
 *
 * Editors should set `relatedToolSlug` and `relatedGuideSlug` in Marble. The
 * inference path keeps older posts working when their title, slug or tags name
 * a registered tool; validation still rejects a published post whose
 * relationship cannot be established rather than adding arbitrary links.
 */
export function relatedBlogContent(post: Post): RelatedBlogContent | null {
  const explicitTool = findTool(fieldSlug(post, 'relatedToolSlug', 'tools'));
  const explicitGuide = findGuide(fieldSlug(post, 'relatedGuideSlug', 'guides'));

  let tool = explicitTool ?? inferTool(post);
  let guide = explicitGuide ?? inferGuide(post);

  if (!tool && guide) tool = findTool(guide.relatedToolSlugs[0] ?? '');
  if (!guide && tool) guide = guidesForTool(tool.slug)[0];

  return tool && guide ? { tool, guide } : null;
}

/** Fail publishing/builds loudly when CMS content would ship an incomplete SEO page. */
export function assertPublishedPostSeoReady(post: Post): void {
  const errors: string[] = [];

  if (!isPublishedPost(post)) errors.push('status is not published');
  if (!post.slug.trim()) errors.push('slug is empty');
  if (!post.title.trim()) errors.push('title is empty');
  if (!blogPostDescription(post)) errors.push('meta description is empty');
  if (!post.content.trim()) errors.push('article body is empty');

  try {
    blogPostDates(post);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'publication dates are invalid');
  }

  if (!relatedBlogContent(post)) {
    errors.push('set valid relatedToolSlug and relatedGuideSlug CMS fields');
  }

  if (errors.length > 0) {
    throw new Error(
      `[marble] published post "${post.slug || post.id}" is not SEO-ready: ${errors.join('; ')}`,
    );
  }
}

/** Enforce collection-wide uniqueness that cannot be checked from one post alone. */
export function assertPublishedPostSet(posts: readonly Post[]): void {
  const published = posts.filter(isPublishedPost);
  const titleOwners = new Map<string, string>();
  const descriptionOwners = new Map<string, string>();
  const slugOwners = new Map<string, string>();

  for (const post of published) {
    assertPublishedPostSeoReady(post);
    claimUnique(titleOwners, post.title, post.slug, 'title');
    claimUnique(descriptionOwners, blogPostDescription(post), post.slug, 'meta description');
    claimUnique(slugOwners, post.slug, post.id, 'canonical slug');
  }
}

export function buildBlogPostMetadata(post: Post): Metadata {
  assertPublishedPostSeoReady(post);
  const path = blogPostPath(post);
  const { published, modified } = blogPostDates(post);
  const base = buildMetadata({
    title: post.title.trim(),
    description: blogPostDescription(post),
    path,
    image: blogPostImageUrl(post),
    imageAlt: blogPostImageAlt(post),
    type: 'article',
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: published.toISOString(),
      modifiedTime: modified.toISOString(),
      authors: [site.name],
    },
  };
}

export function blogPostSchema(post: Post): Record<string, unknown> {
  assertPublishedPostSeoReady(post);
  const canonical = absoluteUrl(blogPostPath(post));
  const { published, modified } = blogPostDates(post);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    headline: post.title.trim(),
    description: blogPostDescription(post),
    url: canonical,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: {
      '@type': 'ImageObject',
      url: blogPostImageUrl(post),
      caption: blogPostImageAlt(post),
    },
    datePublished: published.toISOString(),
    dateModified: modified.toISOString(),
    inLanguage: 'en',
    author: {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      url: absoluteUrl(BLOG_AUTHOR_PATH),
    },
    publisher: { '@id': `${site.url}/#organization` },
  };
}

/** Only published, clean canonical URLs can enter the sitemap. */
export function blogPostSitemapEntries(posts: readonly Post[]): MetadataRoute.Sitemap {
  return posts.filter(isPublishedPost).map((post) => ({
    url: absoluteUrl(blogPostPath(post)),
    lastModified: blogPostDates(post).modified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
}

function validDate(value: string | Date, field: string): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${field} is invalid`);
  return date;
}

function claimUnique(
  owners: Map<string, string>,
  rawValue: string,
  owner: string,
  field: string,
): void {
  const value = rawValue.trim().toLocaleLowerCase('en');
  const existing = owners.get(value);
  if (existing) {
    throw new Error(`[marble] duplicate ${field} on "${existing}" and "${owner}"`);
  }
  owners.set(value, owner);
}

function fieldSlug(post: Post, key: string, route: 'tools' | 'guides'): string {
  const value = post.fields?.[key];
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const path = new URL(trimmed, site.url).pathname;
    const prefix = `/${route}/`;
    return path.startsWith(prefix) ? path.slice(prefix.length).replace(/\/$/, '') : trimmed;
  } catch {
    return trimmed;
  }
}

function inferTool(post: Post): ToolDefinition | undefined {
  return bestMatch(tools, post, (tool) => [
    tool.slug,
    tool.name,
    tool.shortName,
    tool.primaryKeyword,
  ]);
}

function inferGuide(post: Post): GuideDefinition | undefined {
  return bestMatch(guides, post, (guide) => [guide.slug, guide.name, guide.primaryKeyword]);
}

function bestMatch<T>(
  candidates: readonly T[],
  post: Post,
  termsFor: (candidate: T) => readonly string[],
): T | undefined {
  const source = normalize(
    [
      post.slug,
      post.title,
      post.description,
      post.category?.slug,
      post.category?.name,
      ...(post.tags ?? []).flatMap((tag) => [tag.slug, tag.name]),
    ].join(' '),
  );

  let winner: T | undefined;
  let winnerScore = 0;

  for (const candidate of candidates) {
    const score = Math.max(
      ...termsFor(candidate).map((term) => {
        const normalized = normalize(term);
        if (!normalized) return 0;
        if (source.includes(normalized)) return normalized.split(' ').length * 10;
        return distinctiveTokens(normalized).filter((token) => source.includes(` ${token} `))
          .length;
      }),
    );

    if (score > winnerScore) {
      winner = candidate;
      winnerScore = score;
    }
  }

  return winnerScore > 0 ? winner : undefined;
}

function normalize(value: string): string {
  return ` ${value
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()} `;
}

function distinctiveTokens(value: string): string[] {
  const generic = new Set(['calculator', 'generator', 'online', 'free', 'guide', 'tool', 'with']);
  return value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 3 && !generic.has(token));
}
