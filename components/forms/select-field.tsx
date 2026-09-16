'use client';

import type { ReactNode } from 'react';

import { controlClasses, Field } from '@/components/forms/field';
import { cn } from '@/lib/utils/cn';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

/** A native `<select>`. Native beats a custom listbox for accessibility here. */
export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  helper,
  error,
  disabled,
  className,
  labelSuffix,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  helper?: ReactNode;
  error?: string | null;
  disabled?: boolean;
  className?: string;
  labelSuffix?: ReactNode;
}) {
  return (
    <Field
      label={label}
      {...(helper !== undefined ? { helper } : {})}
      {...(error !== undefined ? { error } : {})}
      {...(className !== undefined ? { className } : {})}
      {...(labelSuffix !== undefined ? { labelSuffix } : {})}
    >
      {(fieldProps) => (
        <select
          {...fieldProps}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value as T)}
          className={cn(controlClasses, 'cursor-pointer appearance-none bg-no-repeat pr-9')}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23697184' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: 'right 0.75rem center',
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
