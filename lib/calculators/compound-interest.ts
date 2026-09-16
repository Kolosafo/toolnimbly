/**
 * Compound interest with recurring contributions (spec §6.4).
 *
 * The calculation steps through every compounding period rather than applying
 * an annual closed-form shortcut, which is what makes contribution timing and
 * mismatched contribution/compounding frequencies come out right.
 */

export const COMPOUNDING_FREQUENCIES = {
  daily: { label: 'Daily', periodsPerYear: 365 },
  monthly: { label: 'Monthly', periodsPerYear: 12 },
  quarterly: { label: 'Quarterly', periodsPerYear: 4 },
  semiannual: { label: 'Semiannually', periodsPerYear: 2 },
  annual: { label: 'Annually', periodsPerYear: 1 },
} as const;

export type CompoundingFrequency = keyof typeof COMPOUNDING_FREQUENCIES;

export const CONTRIBUTION_FREQUENCIES = {
  weekly: { label: 'Weekly', perYear: 52 },
  biweekly: { label: 'Every two weeks', perYear: 26 },
  monthly: { label: 'Monthly', perYear: 12 },
  quarterly: { label: 'Quarterly', perYear: 4 },
  annual: { label: 'Annually', perYear: 1 },
} as const;

export type ContributionFrequency = keyof typeof CONTRIBUTION_FREQUENCIES;

export type ContributionTiming = 'beginning' | 'end';

export type CompoundInterestInput = {
  principal: number;
  annualRatePercent: number;
  years: number;
  compounding: CompoundingFrequency;
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  contributionTiming: ContributionTiming;
};

export type CompoundYearRow = {
  year: number;
  openingBalance: number;
  contributions: number;
  interest: number;
  closingBalance: number;
};

export type CompoundInterestResult =
  | {
      ok: true;
      endingBalance: number;
      totalContributions: number;
      totalInterest: number;
      startingPrincipal: number;
      yearRows: CompoundYearRow[];
    }
  | { ok: false; error: string };

const MAX_YEARS = 100;

export function calculateCompoundInterest(
  input: CompoundInterestInput,
): CompoundInterestResult {
  const {
    principal,
    annualRatePercent,
    years,
    compounding,
    contributionAmount,
    contributionFrequency,
    contributionTiming,
  } = input;

  if (!Number.isFinite(principal) || principal < 0) {
    return { ok: false, error: 'The starting amount cannot be negative.' };
  }
  if (!Number.isFinite(annualRatePercent)) {
    return { ok: false, error: 'Enter an annual interest rate.' };
  }
  if (!Number.isFinite(years) || years <= 0) {
    return { ok: false, error: 'Enter a duration of at least one month.' };
  }
  if (years > MAX_YEARS) {
    return { ok: false, error: `This calculator projects up to ${MAX_YEARS} years.` };
  }
  if (!Number.isFinite(contributionAmount) || contributionAmount < 0) {
    return { ok: false, error: 'A contribution cannot be negative.' };
  }

  const periodsPerYear = COMPOUNDING_FREQUENCIES[compounding].periodsPerYear;
  const periodRate = annualRatePercent / 100 / periodsPerYear;

  // A periodic rate of −100% or worse would wipe the balance out entirely and
  // has no meaningful projection.
  if (periodRate <= -1) {
    return {
      ok: false,
      error: 'That negative rate would reduce the balance to zero or below in a single period.',
    };
  }

  const contributionsPerYear = CONTRIBUTION_FREQUENCIES[contributionFrequency].perYear;
  const totalPeriods = Math.round(years * periodsPerYear);

  let balance = principal;
  let totalContributions = 0;
  let totalInterest = 0;

  const yearRows: CompoundYearRow[] = [];
  let yearOpening = principal;
  let yearContributions = 0;
  let yearInterest = 0;

  // Contributions are placed in the compounding period they fall into, rather
  // than being averaged across the year.
  let contributionsMade = 0;

  for (let period = 1; period <= totalPeriods; period += 1) {
    const elapsedYears = period / periodsPerYear;
    const contributionsDue = Math.floor(elapsedYears * contributionsPerYear);
    const contributionsThisPeriod = contributionsDue - contributionsMade;
    contributionsMade = contributionsDue;
    const contribution = contributionsThisPeriod * contributionAmount;

    if (contributionTiming === 'beginning' && contribution > 0) {
      balance += contribution;
      totalContributions += contribution;
      yearContributions += contribution;
    }

    const interest = balance * periodRate;
    balance += interest;
    totalInterest += interest;
    yearInterest += interest;

    if (contributionTiming === 'end' && contribution > 0) {
      balance += contribution;
      totalContributions += contribution;
      yearContributions += contribution;
    }

    const isYearBoundary = period % periodsPerYear === 0 || period === totalPeriods;
    if (isYearBoundary) {
      yearRows.push({
        year: yearRows.length + 1,
        openingBalance: yearOpening,
        contributions: yearContributions,
        interest: yearInterest,
        closingBalance: balance,
      });
      yearOpening = balance;
      yearContributions = 0;
      yearInterest = 0;
    }
  }

  return {
    ok: true,
    endingBalance: balance,
    totalContributions,
    totalInterest,
    startingPrincipal: principal,
    yearRows,
  };
}
