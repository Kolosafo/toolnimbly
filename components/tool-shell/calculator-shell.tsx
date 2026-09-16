'use client';

import { RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

/**
 * The card every calculator renders inside: inputs on the left, results on the
 * right at wide viewports and stacked below at narrow ones (spec §5.4).
 */
export function CalculatorShell({
  children,
  results,
  onReset,
  resetLabel = 'Reset to defaults',
}: {
  children: ReactNode;
  results: ReactNode;
  onReset?: () => void;
  resetLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-surface p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div className="min-w-0 space-y-5">{children}</div>
        <div className="min-w-0">{results}</div>
      </div>

      {onReset ? (
        <div className="mt-6 border-t border-border-default pt-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {resetLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The result region.
 *
 * Marked `aria-live="polite"` so screen readers announce a recalculation
 * without interrupting typing, and `aria-atomic` so the whole result is read
 * rather than just the changed figure.
 */
export function ResultPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      aria-live="polite"
      aria-atomic="true"
      className={cn('rounded-lg border border-border-default bg-surface-sunken p-4 sm:p-5', className)}
    >
      {children}
    </section>
  );
}

/** The single headline figure a calculator exists to produce. */
export function PrimaryResult({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="tabular mt-1 text-3xl font-bold break-words sm:text-4xl">{value}</p>
      {sub ? <div className="mt-1 text-sm text-muted">{sub}</div> : null}
    </div>
  );
}

/** A labelled figure in the supporting breakdown. */
export function ResultRow({
  label,
  value,
  emphasis = false,
  hint,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
      <dt className={cn('text-sm', emphasis ? 'font-medium' : 'text-muted')}>
        {label}
        {hint ? <span className="mt-0.5 block text-xs text-subtle">{hint}</span> : null}
      </dt>
      <dd className={cn('tabular text-sm', emphasis ? 'font-semibold' : 'font-medium')}>{value}</dd>
    </div>
  );
}

export function ResultList({ children }: { children: ReactNode }) {
  return <dl className="divide-y divide-[color:var(--border)]">{children}</dl>;
}

/** Shown before enough input has been entered to produce a result. */
export function ResultPlaceholder({ message }: { message: string }) {
  return <p className="py-6 text-sm text-muted">{message}</p>;
}
