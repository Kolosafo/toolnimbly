import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ToolIcon } from '@/components/ui/tool-icon';
import type { ToolDefinition } from '@/lib/registry/types';
import { cn } from '@/lib/utils/cn';

export function ToolCard({
  tool,
  className,
  showCategory = false,
  categoryName,
}: {
  tool: ToolDefinition;
  className?: string;
  showCategory?: boolean;
  categoryName?: string;
}) {
  return (
    <li className={cn('group relative flex', className)}>
      <div className="flex w-full flex-col rounded-lg border border-border-default bg-surface p-5 transition-colors group-hover:border-brand-border">
        <ToolIcon name={tool.icon} className="size-5 text-brand" />
        <h3 className="mt-3 text-base font-semibold">
          {/* The stretched link makes the whole card clickable while keeping a
              single, descriptive focusable element for keyboard users. */}
          <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0">
            {tool.name}
          </Link>
        </h3>
        {showCategory && categoryName ? (
          <p className="mt-1 text-xs font-medium tracking-wide text-subtle uppercase">
            {categoryName}
          </p>
        ) : null}
        <p className="mt-2 flex-1 text-sm text-muted">{tool.description}</p>
        <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
          Open tool
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </p>
      </div>
    </li>
  );
}
