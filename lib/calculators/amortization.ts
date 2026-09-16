/**
 * Fixed-rate amortisation, shared by the loan and mortgage calculators
 * (spec §6.2, §6.3 and Appendix A).
 *
 * Deliberately uses ordinary double-precision arithmetic: these are estimates
 * from a continuous formula, not a ledger that has to balance to the cent. See
 * ADR 0004 for where exact decimal arithmetic is used instead.
 */

import { addMonths, type CalendarDate } from '@/lib/date/calendar';

export type AmortizationInput = {
  /** Amount borrowed. Must be greater than zero. */
  principal: number;
  /** Annual percentage rate, e.g. 6.25. Must not be negative. */
  annualRatePercent: number;
  /** Total number of monthly payments. Must be a positive integer. */
  termMonths: number;
  /** Optional additional principal paid every month. */
  extraMonthlyPayment?: number;
  /** Optional first payment date, used to label schedule rows. */
  startDate?: CalendarDate;
};

export type AmortizationRow = {
  paymentNumber: number;
  date: CalendarDate | null;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type YearSummary = {
  year: number;
  label: string;
  principal: number;
  interest: number;
  payments: number;
  endingBalance: number;
};

export type AmortizationResult =
  | {
      ok: true;
      /** The contractual payment, excluding any extra principal. */
      scheduledPayment: number;
      /** Scheduled payment plus the extra principal the user entered. */
      totalMonthlyPayment: number;
      totalInterest: number;
      totalPaid: number;
      /** Number of payments actually made, which extra payments can shorten. */
      monthsToPayoff: number;
      payoffDate: CalendarDate | null;
      schedule: AmortizationRow[];
      yearSummaries: YearSummary[];
      /** Present only when an extra payment was supplied. */
      savings: { monthsSaved: number; interestSaved: number } | null;
      warnings: string[];
    }
  | { ok: false; error: string };

/** Hard ceiling on iterations, so a pathological input cannot hang the page. */
const MAX_PAYMENTS = 12 * 100;

/**
 * The standard fixed-rate payment formula.
 * At a zero rate it degenerates to principal divided by the term.
 */
export function monthlyPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
): number {
  if (termMonths <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const growth = (1 + monthlyRate) ** termMonths;
  return (principal * monthlyRate * growth) / (growth - 1);
}

export function buildAmortization(input: AmortizationInput): AmortizationResult {
  const { principal, annualRatePercent, termMonths, startDate } = input;
  const extra = input.extraMonthlyPayment ?? 0;

  if (!Number.isFinite(principal) || principal <= 0) {
    return { ok: false, error: 'Enter a loan amount greater than zero.' };
  }
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) {
    return { ok: false, error: 'The interest rate cannot be negative.' };
  }
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    return { ok: false, error: 'Enter a term of at least one month.' };
  }
  if (termMonths > MAX_PAYMENTS) {
    return { ok: false, error: 'The longest term this calculator supports is 100 years.' };
  }
  if (!Number.isFinite(extra) || extra < 0) {
    return { ok: false, error: 'An extra payment cannot be negative.' };
  }

  const warnings: string[] = [];
  const scheduled = monthlyPayment(principal, annualRatePercent, termMonths);
  const monthlyRate = annualRatePercent / 100 / 12;

  // An extra payment smaller than a rounding cent will not shorten the term and
  // would otherwise look like a broken control.
  if (extra > 0 && extra < 0.01) {
    warnings.push('The extra payment is too small to change the schedule.');
  }

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPaid = 0;
  let paymentNumber = 0;

  while (balance > 1e-9 && paymentNumber < MAX_PAYMENTS) {
    paymentNumber += 1;

    const interest = balance * monthlyRate;
    let principalPortion = scheduled + extra - interest;

    // If the payment does not cover the interest the balance would grow
    // forever. Stop and explain rather than iterating to the cap.
    if (principalPortion <= 0) {
      return {
        ok: false,
        error:
          'At this rate the monthly payment does not cover the interest, so the balance would never fall. Check the amount, rate and term.',
      };
    }

    // Cap the final payment so the balance lands on exactly zero.
    if (principalPortion > balance) principalPortion = balance;

    const payment = principalPortion + interest;
    balance -= principalPortion;
    totalInterest += interest;
    totalPaid += payment;

    schedule.push({
      paymentNumber,
      date: startDate ? addMonths(startDate, paymentNumber - 1) : null,
      payment,
      principal: principalPortion,
      interest,
      balance: balance < 1e-9 ? 0 : balance,
    });
  }

  if (balance > 1e-9) {
    return {
      ok: false,
      error: 'This loan does not pay off within 100 years. Check the amount, rate and term.',
    };
  }

  let savings: { monthsSaved: number; interestSaved: number } | null = null;
  if (extra > 0) {
    const baseline = buildAmortization({ ...input, extraMonthlyPayment: 0 });
    if (baseline.ok) {
      savings = {
        monthsSaved: baseline.monthsToPayoff - paymentNumber,
        interestSaved: baseline.totalInterest - totalInterest,
      };
    }
  }

  const lastRow = schedule[schedule.length - 1];

  return {
    ok: true,
    scheduledPayment: scheduled,
    totalMonthlyPayment: scheduled + extra,
    totalInterest,
    totalPaid,
    monthsToPayoff: paymentNumber,
    payoffDate: lastRow?.date ?? null,
    schedule,
    yearSummaries: summariseByYear(schedule),
    savings,
    warnings,
  };
}

/**
 * Groups the schedule by calendar year when the rows carry dates, and by
 * twelve-payment blocks otherwise. The row's own date is the grouping key, so
 * the loan's start date is not needed here.
 */
function summariseByYear(schedule: readonly AmortizationRow[]): YearSummary[] {
  const summaries: YearSummary[] = [];

  for (let index = 0; index < schedule.length; index += 1) {
    const row = schedule[index];
    if (!row) continue;

    // Group by calendar year when a start date is known, otherwise by
    // twelve-payment blocks labelled "Year 1", "Year 2" and so on.
    const key = row.date ? row.date.year : Math.floor(index / 12) + 1;
    const label = row.date ? String(row.date.year) : `Year ${key}`;

    let summary = summaries.find((entry) => entry.year === key);
    if (!summary) {
      summary = { year: key, label, principal: 0, interest: 0, payments: 0, endingBalance: 0 };
      summaries.push(summary);
    }

    summary.principal += row.principal;
    summary.interest += row.interest;
    summary.payments += row.payment;
    summary.endingBalance = row.balance;
  }

  return summaries;
}

export type MortgageInput = {
  homePrice: number;
  downPayment: number;
  annualRatePercent: number;
  termMonths: number;
  annualPropertyTax: number;
  annualHomeInsurance: number;
  monthlyHoa: number;
  extraMonthlyPayment?: number;
  startDate?: CalendarDate;
};

export type MortgageResult =
  | {
      ok: true;
      loanAmount: number;
      loanToValuePercent: number;
      downPaymentPercent: number;
      principalAndInterest: number;
      monthlyPropertyTax: number;
      monthlyInsurance: number;
      monthlyHoa: number;
      totalMonthlyPayment: number;
      amortization: Extract<AmortizationResult, { ok: true }>;
    }
  | { ok: false; error: string };

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const { homePrice, downPayment } = input;

  if (!Number.isFinite(homePrice) || homePrice <= 0) {
    return { ok: false, error: 'Enter a home price greater than zero.' };
  }
  if (!Number.isFinite(downPayment) || downPayment < 0) {
    return { ok: false, error: 'The down payment cannot be negative.' };
  }
  if (downPayment >= homePrice) {
    return {
      ok: false,
      error: 'The down payment must be less than the home price — there would be nothing to borrow.',
    };
  }
  for (const [label, value] of [
    ['annual property tax', input.annualPropertyTax],
    ['annual home insurance', input.annualHomeInsurance],
    ['monthly HOA', input.monthlyHoa],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) {
      return { ok: false, error: `The ${label} cannot be negative.` };
    }
  }

  const loanAmount = homePrice - downPayment;
  const amortization = buildAmortization({
    principal: loanAmount,
    annualRatePercent: input.annualRatePercent,
    termMonths: input.termMonths,
    ...(input.extraMonthlyPayment !== undefined
      ? { extraMonthlyPayment: input.extraMonthlyPayment }
      : {}),
    ...(input.startDate ? { startDate: input.startDate } : {}),
  });

  if (!amortization.ok) return { ok: false, error: amortization.error };

  const monthlyPropertyTax = input.annualPropertyTax / 12;
  const monthlyInsurance = input.annualHomeInsurance / 12;

  return {
    ok: true,
    loanAmount,
    loanToValuePercent: (loanAmount / homePrice) * 100,
    downPaymentPercent: (downPayment / homePrice) * 100,
    principalAndInterest: amortization.scheduledPayment,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyHoa: input.monthlyHoa,
    totalMonthlyPayment:
      amortization.scheduledPayment + monthlyPropertyTax + monthlyInsurance + input.monthlyHoa,
    amortization,
  };
}
