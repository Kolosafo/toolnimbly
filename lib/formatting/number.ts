/**
 * Output formatting (spec §6 "Shared calculator rules").
 *
 * Internal values are always plain numbers; formatting happens only at the
 * display boundary. Nothing here is ever parsed back into a calculation.
 */

import { site } from '@/lib/config/site';

/** Currencies offered in the pickers. ISO 4217 codes with their minor units. */
export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', label: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', label: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$', decimals: 2 },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'NZD', label: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CNY', label: 'Chinese Yuan', symbol: 'CN¥', decimals: 2 },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'NGN', label: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'BRL', label: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'MXN', label: 'Mexican Peso', symbol: 'MX$', decimals: 2 },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'SEK', label: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'AED', label: 'UAE Dirham', symbol: 'AED', decimals: 2 },
  { code: 'KES', label: 'Kenyan Shilling', symbol: 'KSh', decimals: 2 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export function currencyDecimals(code: string): number {
  return CURRENCIES.find((currency) => currency.code === code)?.decimals ?? 2;
}

/**
 * The browser's locale, falling back to the configured default during server
 * rendering so the markup is stable across hydration.
 */
export function resolveLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
  return site.formattingLocale;
}

export function formatCurrency(
  value: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = resolveLocale(),
): string {
  if (!Number.isFinite(value)) return '—';
  const decimals = currencyDecimals(currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    // An unrecognised currency code should degrade, not throw.
    return `${currency} ${formatNumber(value, decimals, locale)}`;
  }
}

export function formatNumber(
  value: number,
  decimals = 2,
  locale: string = resolveLocale(),
): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Formats with at most `decimals` places, dropping trailing zeros. */
export function formatCompactNumber(
  value: number,
  decimals = 2,
  locale: string = resolveLocale(),
): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: decimals }).format(value);
}

export function formatPercent(
  value: number,
  decimals = 2,
  locale: string = resolveLocale(),
): string {
  if (!Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}%`;
}

export function formatInteger(value: number, locale: string = resolveLocale()): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/**
 * Parses user input into a number.
 *
 * Accepts a leading sign, decimals and thousands separators, and rejects
 * anything non-finite. Returns `null` rather than NaN so callers must handle
 * the invalid case explicitly.
 */
export function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;

  // Strip grouping separators (spaces, apostrophes, commas used as grouping)
  // but keep a decimal comma if it is the only separator present.
  let normalised = trimmed.replace(/[\s'  ]/g, '');
  const commaCount = (normalised.match(/,/g) ?? []).length;
  const dotCount = (normalised.match(/\./g) ?? []).length;

  if (commaCount > 0 && dotCount > 0) {
    // Whichever appears last is the decimal separator.
    normalised =
      normalised.lastIndexOf(',') > normalised.lastIndexOf('.')
        ? normalised.replace(/\./g, '').replace(',', '.')
        : normalised.replace(/,/g, '');
  } else if (commaCount === 1 && !/,\d{3}$/.test(normalised)) {
    normalised = normalised.replace(',', '.');
  } else if (commaCount >= 1) {
    normalised = normalised.replace(/,/g, '');
  }

  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalised)) return null;

  const parsed = Number(normalised);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Rounds to a fixed number of decimal places without floating-point drift. */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** decimals;
  // The epsilon nudge corrects cases such as 1.005 → 1.00 caused by the binary
  // representation sitting a hair below the true value.
  return Math.round((value + Number.EPSILON * Math.sign(value) * Math.abs(value)) * factor) / factor;
}

/** "2 years 3 months" from a month count. */
export function formatMonthsAsYears(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  return parts.length > 0 ? parts.join(' ') : '0 months';
}
