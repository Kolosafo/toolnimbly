/**
 * Joins class names, dropping falsy values.
 *
 * Deliberately tiny: the project uses Tailwind utilities in a disciplined way
 * and does not need conflict-resolving merge semantics, so this avoids pulling
 * in a dependency for string concatenation.
 */
export type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  const push = (value: ClassValue): void => {
    if (!value && value !== 0) return;
    if (Array.isArray(value)) {
      for (const item of value) push(item);
      return;
    }
    out.push(String(value));
  };

  for (const value of values) push(value);
  return out.join(' ');
}
