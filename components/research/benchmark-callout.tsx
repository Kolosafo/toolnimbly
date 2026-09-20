import Link from 'next/link';

import { BENCHMARK_HEADING, BENCHMARK_PATH } from '@/lib/research/publication';
import { benchmarkPublicationGate } from '@/lib/research/report';

/**
 * A contextual link from the invoice and receipt generators to the benchmark.
 *
 * Renders nothing until the report is actually published, so the link appears
 * with the report rather than needing a second change afterwards — and cannot
 * point at a 404 in the meantime. It names the sample size, because that is
 * the thing a reader deciding whether to click wants to know.
 */
const TOOLS_THAT_LINK = new Set(['invoice-generator', 'receipt-generator']);

export function BenchmarkCallout({ toolSlug }: { toolSlug: string }) {
  if (!TOOLS_THAT_LINK.has(toolSlug)) return null;

  const gate = benchmarkPublicationGate();
  if (gate.visibility !== 'published' || !gate.summary) return null;

  return (
    <div className="border-border-default bg-surface mt-3 rounded-lg border p-4">
      <h3 className="text-sm font-medium">
        <Link href={BENCHMARK_PATH} className="hover:text-brand">
          {BENCHMARK_HEADING}
        </Link>
      </h3>
      <p className="text-muted mt-1 text-xs">
        Our own survey of {gate.summary.totalValidResponses} people who invoice for themselves: the
        terms they use, how long they wait, and how often they are paid late. Method and limitations
        included.
      </p>
    </div>
  );
}
