'use client';

import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

export type FieldRenderProps = {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': boolean | undefined;
  required: boolean | undefined;
};

/**
 * Wires a label, optional helper text, an optional unit suffix and an error
 * message to a control (spec §5.3, §5.5).
 *
 * The label is always persistent and visible — never a placeholder — and the
 * helper and error are associated through `aria-describedby` so a screen reader
 * announces them with the field.
 *
 * "Required" is conveyed by the `required` attribute on the control itself
 * (spec §5.3: "use semantic `required` where appropriate") and by a visual
 * asterisk that is hidden from assistive technology. Putting the word into the
 * label instead would fold it into the field's accessible *name*, so the field
 * would announce as "Loan amount (required)" and no longer match its visible
 * label.
 */
export function Field({
  label,
  helper,
  error,
  required,
  children,
  className,
  labelSuffix,
}: {
  label: string;
  helper?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  labelSuffix?: ReactNode;
  children: (props: FieldRenderProps) => ReactNode;
}) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const describedBy =
    [helper ? helperId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-0.5">
          {/* The asterisk sits outside the <label> deliberately. Inside, it
              becomes part of the label's text, so the field's visible label
              ("Loan amount") would no longer match its label text
              ("Loan amount*") — which breaks both exact label lookups and any
              assistive technology that reads label text rather than computing
              the accessible name. The `required` attribute on the control is
              what actually conveys the requirement. */}
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          {required ? (
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          ) : null}
        </div>
        {labelSuffix}
      </div>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required: required || undefined,
      })}

      {helper ? (
        <p id={helperId} className="text-xs text-muted">
          {helper}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="flex items-start gap-1 text-xs text-danger">
          {/* A leading glyph means the error is never signalled by colour alone. */}
          <span aria-hidden="true">⚠</span>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export const controlClasses =
  'min-h-11 w-full rounded-md border border-border-strong bg-surface px-3 text-base ' +
  'transition-colors placeholder:text-subtle ' +
  'aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-60';
