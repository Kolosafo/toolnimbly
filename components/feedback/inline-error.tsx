import { TriangleAlert } from 'lucide-react';

/**
 * A blocking failure shown near the control that produced it.
 *
 * Uses `role="alert"` so it is announced immediately, but does not move focus —
 * repeatedly stealing focus while someone is typing is worse than the problem
 * it solves (spec §5.5).
 */
export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface px-3 py-2 text-sm"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
