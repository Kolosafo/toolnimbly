import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ToolPanel } from '@/components/tool-shell/tool-panel';
import { absoluteUrl } from '@/lib/config/site';
import { findTool, tools } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return tools.map((tool) => ({ slug: tool.slug }));
}

/**
 * Embeds are `noindex` and canonicalise to the tool page.
 *
 * They are a stripped copy of a page that already exists, so left indexable
 * they would compete with the page they are meant to promote — the classic way
 * an embed feature cannibalises its own rankings. They stay crawlable (not
 * disallowed in robots.txt) precisely so Google can read the `noindex`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return {};

  return {
    ...buildMetadata({
      title: tool.title,
      description: tool.description,
      path: `/tools/${tool.slug}`,
      noIndex: true,
    }),
    title: { absolute: `${tool.name} — embedded` },
  };
}

export default async function EmbedPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) notFound();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <h1 className="sr-only">{tool.name}</h1>

      <ToolPanel tool={tool} />

      {/*
        The credit line. This link is for the person looking at the embed, not
        for a crawler — inside our own iframe it is an internal link and earns
        nothing. The link that earns is the one in the snippet, in the host
        page's HTML. `target="_blank"` because we are inside someone else's
        frame and replacing it would be hostile.

        A plain <a> rather than next/link: this is a cross-document navigation
        into a new tab, so the client router has nothing to contribute, and it
        avoids prefetching a route the visitor is unlikely to open. Measured,
        the prefetch was worth about 9 KB here rather than the whole tool
        bundle — small, but not nothing on someone else's page.

        Absolute rather than root-relative. A relative href would in fact
        resolve correctly against this document's own origin, but an absolute
        URL is what gets copied when someone saves or shares the embed, and it
        cannot be misread when this markup is viewed out of context.
      */}
      <p className="text-center text-xs text-muted">
        Powered by{' '}
        <a
          href={absoluteUrl(`/tools/${tool.slug}`)}
          target="_blank"
          rel="noopener"
          className="font-medium text-brand underline underline-offset-2"
        >
          {tool.name}
        </a>{' '}
        from ToolNimbly — free, and runs entirely in your browser.
      </p>
    </div>
  );
}
