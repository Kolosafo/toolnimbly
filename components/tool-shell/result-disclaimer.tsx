import { TriangleAlert } from 'lucide-react';

/**
 * Scope-specific disclaimer rendered immediately beside the result area for
 * health and finance tools (spec §8.5) — not buried in Terms.
 */
export function ResultDisclaimer({ text }: { text: string }) {
  return (
    <aside
      aria-label="Important information about these results"
      className="mt-4 flex items-start gap-2 rounded-lg border border-warning-border bg-warning-surface p-4 text-sm"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <p className="measure">{text}</p>
    </aside>
  );
}
