import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ToolIcon } from '@/components/ui/tool-icon';
import type { CategoryDefinition } from '@/lib/registry/types';

export function CategoryCard({
  category,
  toolCount,
  sampleTools,
}: {
  category: CategoryDefinition;
  toolCount: number;
  sampleTools: readonly string[];
}) {
  return (
    <li className="group relative flex">
      <div className="flex w-full flex-col rounded-lg border border-border-default bg-surface p-6 transition-colors group-hover:border-brand-border">
        <ToolIcon name={category.icon} className="size-6 text-brand" />
        <h3 className="mt-4 text-lg font-semibold">
          <Link href={`/${category.slug}`} className="after:absolute after:inset-0">
            {category.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-subtle">
          {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
        </p>
        <p className="mt-3 flex-1 text-sm text-muted">{category.description}</p>
        {sampleTools.length > 0 ? (
          <p className="mt-3 text-xs text-subtle">Includes {sampleTools.join(', ')}</p>
        ) : null}
        <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
          Browse {category.shortName}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </p>
      </div>
    </li>
  );
}
