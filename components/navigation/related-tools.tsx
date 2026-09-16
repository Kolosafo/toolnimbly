import Link from 'next/link';

import { ToolIcon } from '@/components/ui/tool-icon';
import type { ToolDefinition } from '@/lib/registry/types';

/**
 * Curated related tools (spec §5.2, §8.4). Link text names the destination, so
 * it is meaningful when read out of context by a screen reader.
 */
export function RelatedTools({
  tools,
  heading = 'Related tools',
  description,
}: {
  tools: readonly ToolDefinition[];
  heading?: string;
  description?: string;
}) {
  if (tools.length === 0) return null;

  return (
    <section aria-labelledby="related-tools-heading" className="mt-12">
      <h2 id="related-tools-heading" className="text-xl font-semibold">
        {heading}
      </h2>
      {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug} className="group relative">
            <div className="flex h-full gap-3 rounded-lg border border-border-default bg-surface p-4 transition-colors group-hover:border-brand-border">
              <ToolIcon name={tool.icon} className="mt-0.5 size-4 shrink-0 text-brand" />
              <div className="min-w-0">
                <h3 className="text-sm font-medium">
                  <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0">
                    {tool.name}
                  </Link>
                </h3>
                <p className="mt-1 text-xs text-muted">{tool.description}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
