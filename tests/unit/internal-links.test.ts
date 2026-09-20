import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { allIndexableRoutes, categories, tools } from '@/lib/registry';
import { referencedBlogPostPaths } from '@/lib/registry/blog-posts';
import { BENCHMARK_PATH, RESEARCH_INDEX_PATH, SURVEY_PATH } from '@/lib/research/publication';

/**
 * Link integrity (spec §8.4): no orphan tool routes and no internal link that
 * points at a route the registry does not define.
 */

const projectRoot = process.cwd();
const scanDirs = ['app', 'components', 'content', 'lib'];

function collectSourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectSourceFiles(full, found);
    } else if (/\.tsx?$/.test(entry)) {
      found.push(full);
    }
  }
  return found;
}

/** Internal hrefs written as string literals in `href="..."` or `href={`...`}`. */
function extractInternalHrefs(source: string): string[] {
  const hrefs: string[] = [];
  const pattern = /href=(?:"(\/[^"]*)"|\{`(\/[^`${]*)`\})/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const href = match[1] ?? match[2];
    if (href) hrefs.push(href);
  }
  return hrefs;
}

/*
 * Routes that exist in the codebase, which is not the same set as the routes
 * currently indexed. `/blog` is built from `app/(site)/blog/` whatever
 * NEXT_PUBLIC_BLOG_ENABLED says; the flag decides whether it 404s and whether
 * it reaches the sitemap, not whether the source file exists. Scanning blog
 * source for links while excluding /blog from the known set reports a link
 * that is unreachable, not broken.
 */
/*
 * The research routes exist in `app/` whatever the publication flags say — the
 * flags decide whether they 404 and whether they reach the sitemap, exactly as
 * with `/blog`. The two CMS post paths come from the one list that the pages
 * link through, so a slug cannot be changed in a page without the test noticing.
 */
const knownRoutes = new Set([
  ...allIndexableRoutes(),
  '/blog',
  ...referencedBlogPostPaths(),
  RESEARCH_INDEX_PATH,
  BENCHMARK_PATH,
  SURVEY_PATH,
]);

describe('internal links', () => {
  const files = scanDirs.flatMap((dir) => collectSourceFiles(join(projectRoot, dir)));

  it('finds source files to scan', () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it('points every hardcoded internal link at a route that exists', () => {
    const broken: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const href of extractInternalHrefs(source)) {
        // Skip anchors, metadata-only paths and the site's own asset routes.
        if (href.startsWith('/#')) continue;
        if (href === '/icon.svg' || href === '/sitemap.xml' || href === '/opengraph-image')
          continue;
        if (href === '/manifest.webmanifest') continue;
        // A static file served from `public/research/`, not an app route.
        if (href.endsWith('-aggregates.csv')) continue;
        const path = href.split('#')[0]?.split('?')[0] ?? href;
        if (!knownRoutes.has(path)) {
          broken.push(`${file.replace(projectRoot + '/', '')} → ${href}`);
        }
      }
    }

    expect(broken).toEqual([]);
  });

  it('has no orphan tool routes — every tool is linked from its category page', () => {
    // Category pages render every tool in their category from the registry, so
    // reachability is guaranteed by construction; this asserts the property the
    // page relies on rather than re-deriving it.
    for (const category of categories) {
      const inCategory = tools.filter((tool) => tool.category === category.slug);
      expect(inCategory.length, `${category.slug} has no tools`).toBeGreaterThan(0);
    }
    const categorised = new Set(tools.map((tool) => tool.category));
    expect(categorised.size).toBe(categories.length);
  });

  it('keeps the sitemap and navigation in agreement', () => {
    const routes = allIndexableRoutes();
    for (const tool of tools) expect(routes).toContain(`/tools/${tool.slug}`);
    for (const category of categories) expect(routes).toContain(`/${category.slug}`);
  });
});
