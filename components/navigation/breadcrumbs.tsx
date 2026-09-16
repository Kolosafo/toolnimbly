import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbSchema, type BreadcrumbEntry } from '@/lib/seo/structured-data';

/**
 * Semantic breadcrumbs with matching `BreadcrumbList` JSON-LD (spec §8.1).
 * The final entry is the current page and is not a link.
 */
export function Breadcrumbs({ entries }: { entries: readonly BreadcrumbEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          {entries.map((entry, index) => {
            const isLast = index === entries.length - 1;
            return (
              <li key={entry.path} className="flex items-center gap-1">
                {index > 0 ? (
                  <ChevronRight className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />
                ) : null}
                {isLast ? (
                  <span aria-current="page" className="text-foreground">
                    {entry.name}
                  </span>
                ) : (
                  <Link href={entry.path} className="hover:text-foreground hover:underline">
                    {entry.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(entries)} />
    </>
  );
}
