/**
 * Pay-frequency conversion (spec §6.5).
 *
 * This is explicitly not a tax or payroll calculator. Every figure is gross.
 * Everything is derived from one normalised annual value so the rows stay
 * internally consistent.
 */

export const PAY_FREQUENCIES = {
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  semimonthly: 'Semimonthly',
  monthly: 'Monthly',
  annual: 'Annual',
} as const;

export type PayFrequency = keyof typeof PAY_FREQUENCIES;

/** Fixed calendar divisors: 26 fortnights and 24 half-months in a year. */
export const BIWEEKLY_PERIODS_PER_YEAR = 26;
export const SEMIMONTHLY_PERIODS_PER_YEAR = 24;
export const MONTHS_PER_YEAR = 12;

export const SALARY_DEFAULTS = {
  hoursPerWeek: 40,
  workdaysPerWeek: 5,
  paidWeeksPerYear: 52,
} as const;

export type SalaryInput = {
  amount: number;
  frequency: PayFrequency;
  hoursPerWeek: number;
  workdaysPerWeek: number;
  paidWeeksPerYear: number;
};

export type SalaryBreakdown = {
  hourly: number;
  daily: number;
  weekly: number;
  biweekly: number;
  semimonthly: number;
  monthly: number;
  annual: number;
};

export type SalaryResult =
  | { ok: true; breakdown: SalaryBreakdown; annualEquivalent: number; totalHoursPerYear: number }
  | { ok: false; error: string };

export function calculateSalary(input: SalaryInput): SalaryResult {
  const { amount, frequency, hoursPerWeek, workdaysPerWeek, paidWeeksPerYear } = input;

  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: 'Enter a pay amount of zero or more.' };
  }
  if (!Number.isFinite(hoursPerWeek) || hoursPerWeek <= 0 || hoursPerWeek > 168) {
    return { ok: false, error: 'Hours per week must be between 0 and 168.' };
  }
  if (!Number.isFinite(workdaysPerWeek) || workdaysPerWeek <= 0 || workdaysPerWeek > 7) {
    return { ok: false, error: 'Workdays per week must be between 0 and 7.' };
  }
  if (!Number.isFinite(paidWeeksPerYear) || paidWeeksPerYear <= 0 || paidWeeksPerYear > 53) {
    return { ok: false, error: 'Paid weeks per year must be between 0 and 53.' };
  }

  // Normalise to an annual figure first; every other period derives from it.
  const annual = toAnnual(amount, frequency, hoursPerWeek, workdaysPerWeek, paidWeeksPerYear);
  const totalHoursPerYear = hoursPerWeek * paidWeeksPerYear;

  return {
    ok: true,
    annualEquivalent: annual,
    totalHoursPerYear,
    breakdown: {
      hourly: annual / totalHoursPerYear,
      daily: annual / (workdaysPerWeek * paidWeeksPerYear),
      weekly: annual / paidWeeksPerYear,
      biweekly: annual / BIWEEKLY_PERIODS_PER_YEAR,
      semimonthly: annual / SEMIMONTHLY_PERIODS_PER_YEAR,
      monthly: annual / MONTHS_PER_YEAR,
      annual,
    },
  };
}

function toAnnual(
  amount: number,
  frequency: PayFrequency,
  hoursPerWeek: number,
  workdaysPerWeek: number,
  paidWeeksPerYear: number,
): number {
  switch (frequency) {
    case 'hourly':
      return amount * hoursPerWeek * paidWeeksPerYear;
    case 'daily':
      return amount * workdaysPerWeek * paidWeeksPerYear;
    case 'weekly':
      return amount * paidWeeksPerYear;
    case 'biweekly':
      return amount * BIWEEKLY_PERIODS_PER_YEAR;
    case 'semimonthly':
      return amount * SEMIMONTHLY_PERIODS_PER_YEAR;
    case 'monthly':
      return amount * MONTHS_PER_YEAR;
    case 'annual':
      return amount;
    default:
      return amount;
  }
}
