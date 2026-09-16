'use client';

import { useId } from 'react';

/**
 * A labelled checkbox. Native `<input type="checkbox">` rather than a custom
 * switch, so it works with every assistive technology without extra ARIA.
 */
export function SwitchField({
  label,
  checked,
  onChange,
  helper,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helper?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const helperId = `${id}-helper`;

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={helper ? helperId : undefined}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-border-strong accent-[color:var(--brand)] disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </label>
        {helper ? (
          <p id={helperId} className="mt-0.5 text-xs text-muted">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}
