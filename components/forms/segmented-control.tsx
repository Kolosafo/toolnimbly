'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils/cn';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

/**
 * A mode switcher built from a native radio group.
 *
 * Radios give arrow-key navigation and correct announcement for free, which a
 * row of buttons with `aria-pressed` would not.
 *
 * The option's description is associated with `aria-describedby` rather than
 * nested inside the `<label>`. Nesting it would fold the description into the
 * radio's accessible *name* — so a screen reader would announce "Percentage
 * change Compare a starting and an ending value, radio" instead of the name
 * followed by its description. Clicking the description still selects the
 * option, because the whole row remains inside the label element.
 */
export function SegmentedControl<T extends string>({
  legend,
  value,
  onChange,
  options,
  columns = 'auto',
}: {
  legend: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentOption<T>[];
  columns?: 'auto' | 'stack';
}) {
  const name = useId();

  return (
    <fieldset>
      <legend className="text-sm font-medium">{legend}</legend>
      <div
        className={cn(
          'mt-2 grid gap-2',
          columns === 'stack' ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {options.map((option) => {
          const checked = option.value === value;
          const descriptionId = option.description ? `${name}-${option.value}-description` : undefined;

          return (
            <div
              key={option.value}
              className={cn(
                'rounded-md border transition-colors',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[color:var(--focus-ring)]',
                checked
                  ? 'border-brand-border bg-brand-surface'
                  : 'border-border-default bg-surface hover:border-border-strong',
              )}
            >
              <label className="flex cursor-pointer items-start gap-2.5 p-3">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  aria-describedby={descriptionId}
                  onChange={() => onChange(option.value)}
                  className="mt-0.5 size-4 shrink-0 accent-[color:var(--brand)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{option.label}</span>
                  {option.description ? (
                    <span id={descriptionId} className="mt-0.5 block text-xs text-muted">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
