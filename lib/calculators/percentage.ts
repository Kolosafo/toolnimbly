/**
 * Percentage calculations (spec §6.1). Pure, side-effect free, React-free.
 */

export type PercentageMode = 'percentOf' | 'isWhatPercent' | 'percentChange';

export type PercentageResult =
  | {
      ok: true;
      value: number;
      /** The substituted equation, shown next to the answer. */
      equation: string;
      /** Plain-language reading of the result, e.g. "a 25% increase". */
      interpretation: string;
      /** Extra figures worth showing, such as the original plus the result. */
      extras: { label: string; value: number }[];
    }
  | { ok: false; error: string };

export function calculatePercentage(
  mode: PercentageMode,
  x: number,
  y: number,
): PercentageResult {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return { ok: false, error: 'Enter two numbers to calculate a result.' };
  }

  switch (mode) {
    case 'percentOf': {
      const value = (y * x) / 100;
      return {
        ok: true,
        value,
        equation: `${format(y)} × ${format(x)} ÷ 100 = ${format(value)}`,
        interpretation: `${format(x)}% of ${format(y)} is ${format(value)}.`,
        extras: [
          { label: `${format(y)} plus ${format(x)}%`, value: y + value },
          { label: `${format(y)} minus ${format(x)}%`, value: y - value },
        ],
      };
    }

    case 'isWhatPercent': {
      if (y === 0) {
        return {
          ok: false,
          error:
            'The second number cannot be zero. Nothing can be expressed as a percentage of zero.',
        };
      }
      const value = (x / y) * 100;
      return {
        ok: true,
        value,
        equation: `${format(x)} ÷ ${format(y)} × 100 = ${format(value)}%`,
        interpretation: `${format(x)} is ${format(value)}% of ${format(y)}.`,
        extras: [{ label: 'Remaining share', value: 100 - value }],
      };
    }

    case 'percentChange': {
      if (x === 0) {
        return {
          ok: false,
          error:
            'The starting value cannot be zero. A change away from zero has no defined percentage.',
        };
      }
      const value = ((y - x) / Math.abs(x)) * 100;
      const direction = value > 0 ? 'increase' : value < 0 ? 'decrease' : 'no change';
      return {
        ok: true,
        value,
        equation: `(${format(y)} − ${format(x)}) ÷ |${format(x)}| × 100 = ${format(value)}%`,
        interpretation:
          value === 0
            ? `There is no change between ${format(x)} and ${format(y)}.`
            : `That is ${format(Math.abs(value))}% ${direction} from ${format(x)} to ${format(y)}.`,
        extras: [{ label: 'Absolute change', value: y - x }],
      };
    }

    default: {
      return { ok: false, error: 'Unknown calculation mode.' };
    }
  }
}

/** Compact display used inside equation strings; full precision is retained. */
function format(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(6)));
}
