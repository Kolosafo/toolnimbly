'use client';

import type { ReactNode } from 'react';

import { controlClasses, Field } from '@/components/forms/field';
import { cn } from '@/lib/utils/cn';

/**
 * A numeric text input.
 *
 * `inputMode="decimal"` gives phones the right keypad while keeping the control
 * a text input, which avoids the scroll-wheel and spinner surprises of
 * `type="number"` and lets us accept grouped input like "1,200.50".
 */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  helper,
  error,
  placeholder,
  required,
  disabled,
  min,
  max,
  className,
  labelSuffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: ReactNode;
  helper?: ReactNode;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
  labelSuffix?: ReactNode;
}) {
  return (
    <Field
      label={label}
      {...(helper !== undefined ? { helper } : {})}
      {...(error !== undefined ? { error } : {})}
      {...(required !== undefined ? { required } : {})}
      {...(className !== undefined ? { className } : {})}
      {...(labelSuffix !== undefined ? { labelSuffix } : {})}
    >
      {(fieldProps) => (
        <div className="relative flex items-center">
          <input
            {...fieldProps}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={value}
            disabled={disabled}
            placeholder={placeholder}
            {...(min !== undefined ? { 'aria-valuemin': min } : {})}
            {...(max !== undefined ? { 'aria-valuemax': max } : {})}
            onChange={(event) => onChange(event.target.value)}
            className={cn(controlClasses, unit ? 'pr-14' : undefined, 'tabular')}
          />
          {unit ? (
            // Presentational: the unit is already part of the accessible name
            // via the label, so announcing it twice would be noise.
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 text-sm text-muted"
            >
              {unit}
            </span>
          ) : null}
        </div>
      )}
    </Field>
  );
}
