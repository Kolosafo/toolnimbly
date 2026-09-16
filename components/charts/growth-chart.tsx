'use client';

import { formatCurrency } from '@/lib/formatting/number';

export type GrowthBar = {
  label: string;
  principal: number;
  contributions: number;
  interest: number;
  total: number;
};

/**
 * A stacked bar chart of balance composition over time.
 *
 * Accessibility (spec §5.5): the chart itself is `aria-hidden`, because a
 * screen reader cannot usefully consume a bar. The same data is published as a
 * real table immediately below it, which is the accessible equivalent — so the
 * information is never conveyed by the graphic alone. The three series are
 * distinguished by a hatch pattern as well as by colour.
 */
export function GrowthChart({
  bars,
  currency,
  title,
}: {
  bars: readonly GrowthBar[];
  currency: string;
  title: string;
}) {
  if (bars.length === 0) return null;

  const max = Math.max(...bars.map((bar) => bar.total), 1);
  // Keep the bar count readable on a phone by sampling long projections.
  const step = Math.max(1, Math.ceil(bars.length / 24));
  const shown = bars.filter((_, index) => index % step === 0 || index === bars.length - 1);

  return (
    <figure className="mt-6">
      <figcaption className="text-sm font-medium">{title}</figcaption>

      <div
        aria-hidden="true"
        className="mt-3 flex h-56 items-end gap-1 overflow-x-auto rounded-lg border border-border-default bg-surface p-3"
      >
        {shown.map((bar) => {
          const heightOf = (value: number) => `${(value / max) * 100}%`;
          return (
            <div
              key={bar.label}
              className="flex h-full min-w-4 flex-1 flex-col justify-end"
              title={`${bar.label}: ${formatCurrency(bar.total, currency)}`}
            >
              <div
                className="w-full rounded-t-sm bg-[color:var(--brand)]"
                style={{ height: heightOf(bar.interest) }}
              />
              <div
                className="w-full bg-[color:var(--tn-brand-400)]"
                style={{
                  height: heightOf(bar.contributions),
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.45) 3px, rgba(255,255,255,0.45) 6px)',
                }}
              />
              <div
                className="w-full rounded-b-sm bg-[color:var(--tn-neutral-400)]"
                style={{ height: heightOf(bar.principal) }}
              />
            </div>
          );
        })}
      </div>

      <ul aria-hidden="true" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[color:var(--tn-neutral-400)]" />
          Starting amount
        </li>
        <li className="flex items-center gap-2">
          <span
            className="size-3 rounded-sm bg-[color:var(--tn-brand-400)]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.45) 3px, rgba(255,255,255,0.45) 6px)',
            }}
          />
          Contributions (hatched)
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-[color:var(--brand)]" />
          Interest
        </li>
      </ul>

      <p className="mt-2 text-xs text-muted">
        The table below lists the same figures for every year, including any years the chart samples
        out.
      </p>
    </figure>
  );
}
