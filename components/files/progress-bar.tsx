'use client';

/**
 * Determinate progress where it can be measured, and an honest busy state where
 * it cannot (spec §5.3). Never a fake animation standing in for real progress.
 */
export function ProgressBar({
  completed,
  total,
  label,
  onCancel,
}: {
  completed: number;
  total: number;
  label: string;
  onCancel?: () => void;
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mt-4 rounded-lg border border-border-default bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-3 text-sm font-medium transition-colors hover:bg-surface-sunken"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={label}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="tabular mt-2 text-xs text-muted" aria-live="polite">
        {completed} of {total} complete
      </p>
    </div>
  );
}
