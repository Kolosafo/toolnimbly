/**
 * Exact decimal money (ADR 0004, spec §6.29, §6.30).
 *
 * Binary floating point cannot represent 0.1, so `0.1 + 0.2` is
 * 0.30000000000000004. Accumulated across line items, discounts and tax that
 * produces totals that are a cent out and do not reconcile — which on an
 * invoice is a real defect, not a rounding curiosity.
 *
 * Every amount here is a `Big`. Rounding happens once, at the display boundary,
 * using the decimal convention of the selected currency.
 */

import Big from 'big.js';

import { CURRENCIES, currencyDecimals, type CurrencyCode } from '@/lib/formatting/number';

export type Money = Big;

/** Rounds half away from zero, which is what invoices conventionally use. */
Big.RM = Big.roundHalfUp;

export function money(value: string | number | Big | null | undefined): Money {
  if (value === null || value === undefined || value === '') return new Big(0);
  try {
    return new Big(value);
  } catch {
    return new Big(0);
  }
}

/**
 * Parses a user-entered amount.
 *
 * Returns `null` for anything unparseable so callers must handle it, rather
 * than silently treating a typo as zero.
 */
export function parseMoney(raw: string): Money | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  // Strip currency symbols, spaces and grouping separators, keeping one
  // decimal separator.
  let normalised = trimmed.replace(/[^\d.,\-]/g, '');

  const commas = (normalised.match(/,/g) ?? []).length;
  const dots = (normalised.match(/\./g) ?? []).length;

  if (commas > 0 && dots > 0) {
    normalised =
      normalised.lastIndexOf(',') > normalised.lastIndexOf('.')
        ? normalised.replace(/\./g, '').replace(',', '.')
        : normalised.replace(/,/g, '');
  } else if (commas === 1 && !/,\d{3}$/.test(normalised)) {
    normalised = normalised.replace(',', '.');
  } else if (commas >= 1) {
    normalised = normalised.replace(/,/g, '');
  }

  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(normalised)) return null;

  try {
    return new Big(normalised);
  } catch {
    return null;
  }
}

export function isZero(value: Money): boolean {
  return value.eq(0);
}

export function isNegative(value: Money): boolean {
  return value.lt(0);
}

/** Rounds to the currency's minor units. Call once, at the display boundary. */
export function roundToCurrency(value: Money, currency: CurrencyCode): Money {
  return value.round(currencyDecimals(currency), Big.roundHalfUp);
}

/** Formats for display, respecting the currency's decimal places. */
export function formatMoney(
  value: Money,
  currency: CurrencyCode,
  locale?: string,
): string {
  const decimals = currencyDecimals(currency);
  const rounded = roundToCurrency(value, currency);

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(Number(rounded.toFixed(decimals)));
  } catch {
    return `${currency} ${rounded.toFixed(decimals)}`;
  }
}

/** The plain numeric string, for embedding in a generated PDF. */
export function moneyToFixed(value: Money, currency: CurrencyCode): string {
  return roundToCurrency(value, currency).toFixed(currencyDecimals(currency));
}

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((entry) => entry.code === code)?.symbol ?? code;
}

export function sumMoney(values: readonly Money[]): Money {
  return values.reduce<Money>((total, value) => total.plus(value), new Big(0));
}

/** A percentage of an amount, kept exact until display. */
export function percentOf(amount: Money, percent: Money): Money {
  return amount.times(percent).div(100);
}
