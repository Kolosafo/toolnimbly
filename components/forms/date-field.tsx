'use client';

import type { ReactNode } from 'react';

import { controlClasses, Field } from '@/components/forms/field';
import { formatIsoDate, parseIsoDate, type CalendarDate } from '@/lib/date/calendar';

/**
 * A date input bound to a `CalendarDate` rather than a `Date`.
 *
 * The native control exchanges `YYYY-MM-DD` strings, which are parsed by the
 * calendar module's timezone-free parser — never by `new Date()` (ADR 0003).
 */
export function DateField({
  label,
  value,
  onChange,
  helper,
  error,
  required,
  min,
  max,
  className,
}: {
  label: string;
  value: CalendarDate | null;
  onChange: (value: CalendarDate | null) => void;
  helper?: ReactNode;
  error?: string | null;
  required?: boolean;
  min?: CalendarDate;
  max?: CalendarDate;
  className?: string;
}) {
  return (
    <Field
      label={label}
      {...(helper !== undefined ? { helper } : {})}
      {...(error !== undefined ? { error } : {})}
      {...(required !== undefined ? { required } : {})}
      {...(className !== undefined ? { className } : {})}
    >
      {(fieldProps) => (
        <input
          {...fieldProps}
          type="date"
          value={value ? formatIsoDate(value) : ''}
          min={min ? formatIsoDate(min) : undefined}
          max={max ? formatIsoDate(max) : undefined}
          onChange={(event) => onChange(parseIsoDate(event.target.value))}
          className={controlClasses}
        />
      )}
    </Field>
  );
}
