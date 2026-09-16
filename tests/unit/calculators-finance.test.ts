import { describe, expect, it } from 'vitest';

import {
  buildAmortization,
  calculateMortgage,
  monthlyPayment,
} from '@/lib/calculators/amortization';
import { calculateCompoundInterest } from '@/lib/calculators/compound-interest';
import { calculatePercentage } from '@/lib/calculators/percentage';
import { calculateSalary, SALARY_DEFAULTS } from '@/lib/calculators/salary';

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

describe('percentage calculator', () => {
  it('matches the spec reference cases', () => {
    // 20% of 50 = 10
    const a = calculatePercentage('percentOf', 20, 50);
    expect(a.ok && round(a.value)).toBe(10);

    // 25 is 50% of 50
    const b = calculatePercentage('isWhatPercent', 25, 50);
    expect(b.ok && round(b.value)).toBe(50);

    // 80 to 100 = 25% increase
    const c = calculatePercentage('percentChange', 80, 100);
    expect(c.ok && round(c.value)).toBe(25);
    expect(c.ok && c.interpretation).toContain('increase');
  });

  it('matches the worked example published on the page', () => {
    const tip = calculatePercentage('percentOf', 15, 68.4);
    expect(tip.ok && round(tip.value)).toBe(10.26);
    expect(tip.ok && round(tip.extras[0]?.value ?? 0)).toBe(78.66);

    const change = calculatePercentage('percentChange', 68.4, 78.66);
    expect(change.ok && round(change.value)).toBe(15);
  });

  it('rejects the two undefined cases with an explanation', () => {
    const zeroBase = calculatePercentage('isWhatPercent', 25, 0);
    expect(zeroBase.ok).toBe(false);
    expect(!zeroBase.ok && zeroBase.error).toMatch(/cannot be zero/i);

    const zeroStart = calculatePercentage('percentChange', 0, 50);
    expect(zeroStart.ok).toBe(false);
    expect(!zeroStart.ok && zeroStart.error).toMatch(/zero/i);
  });

  it('labels a decrease in words, not only by sign', () => {
    const result = calculatePercentage('percentChange', 100, 75);
    expect(result.ok && round(result.value)).toBe(-25);
    expect(result.ok && result.interpretation).toContain('decrease');
  });

  it('uses the absolute starting value so direction reads correctly from a negative', () => {
    // −20 to −10 is an increase of 50%, not a decrease.
    const result = calculatePercentage('percentChange', -20, -10);
    expect(result.ok && round(result.value)).toBe(50);
    expect(result.ok && result.interpretation).toContain('increase');
  });

  it('handles decimals and negatives without losing precision', () => {
    const result = calculatePercentage('percentOf', 12.5, -80);
    expect(result.ok && round(result.value)).toBe(-10);
  });

  it('reports no change when the values are equal', () => {
    const result = calculatePercentage('percentChange', 42, 42);
    expect(result.ok && result.value).toBe(0);
    expect(result.ok && result.interpretation).toMatch(/no change/i);
  });
});

describe('loan amortisation', () => {
  it('matches the spec reference: a 12-month 0% loan of 1,200', () => {
    const result = buildAmortization({
      principal: 1200,
      annualRatePercent: 0,
      termMonths: 12,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(round(result.scheduledPayment)).toBe(100);
    expect(round(result.totalPaid)).toBe(1200);
    expect(round(result.totalInterest)).toBe(0);
    expect(result.schedule).toHaveLength(12);
    expect(round(result.schedule.reduce((sum, row) => sum + row.payment, 0))).toBe(1200);
  });

  it('matches the worked example published on the loan page', () => {
    const result = buildAmortization({
      principal: 25_000,
      annualRatePercent: 7.5,
      termMonths: 60,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(round(result.scheduledPayment)).toBe(500.95);
    expect(round(result.totalInterest)).toBe(5056.92);
    expect(round(result.totalPaid)).toBe(30_056.92);
    // First payment is mostly interest: 25,000 × 7.5% ÷ 12
    expect(round(result.schedule[0]?.interest ?? 0)).toBe(156.25);
  });

  it('matches the published extra-payment saving', () => {
    const result = buildAmortization({
      principal: 25_000,
      annualRatePercent: 7.5,
      termMonths: 60,
      extraMonthlyPayment: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.monthsToPayoff).toBe(49);
    expect(result.savings?.monthsSaved).toBe(11);
    expect(round(result.savings?.interestSaved ?? 0)).toBe(1013.61);
  });

  it('ends at exactly a zero balance, never a few cents either side', () => {
    const cases = [
      { principal: 25_000, annualRatePercent: 7.5, termMonths: 60 },
      { principal: 357_000, annualRatePercent: 6.25, termMonths: 360 },
      { principal: 1200, annualRatePercent: 0, termMonths: 12 },
      { principal: 9999.99, annualRatePercent: 3.33, termMonths: 17 },
      { principal: 500_000, annualRatePercent: 12, termMonths: 240, extraMonthlyPayment: 750 },
    ];

    for (const input of cases) {
      const result = buildAmortization(input);
      expect(result.ok, JSON.stringify(input)).toBe(true);
      if (!result.ok) continue;
      const last = result.schedule[result.schedule.length - 1];
      expect(last?.balance).toBe(0);
      expect(Math.abs((last?.balance ?? 1))).toBeLessThan(1e-9);
    }
  });

  it('keeps principal plus interest equal to the total paid', () => {
    const result = buildAmortization({
      principal: 180_000,
      annualRatePercent: 5.4,
      termMonths: 300,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(round(result.totalPaid)).toBe(round(180_000 + result.totalInterest));
  });

  it('yearly summaries reconcile with the full schedule', () => {
    const result = buildAmortization({
      principal: 240_000,
      annualRatePercent: 4.8,
      termMonths: 360,
      startDate: { year: 2026, month: 1, day: 1 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const summedPrincipal = result.yearSummaries.reduce((sum, year) => sum + year.principal, 0);
    const summedInterest = result.yearSummaries.reduce((sum, year) => sum + year.interest, 0);
    expect(round(summedPrincipal)).toBe(240_000);
    expect(round(summedInterest)).toBe(round(result.totalInterest));
    expect(result.yearSummaries[result.yearSummaries.length - 1]?.endingBalance).toBe(0);
  });

  it('labels schedule rows with real calendar dates when given a start date', () => {
    const result = buildAmortization({
      principal: 10_000,
      annualRatePercent: 5,
      termMonths: 24,
      startDate: { year: 2026, month: 1, day: 31 },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.schedule[0]?.date).toEqual({ year: 2026, month: 1, day: 31 });
    // Month-end clamping, not an overflow into March.
    expect(result.schedule[1]?.date).toEqual({ year: 2026, month: 2, day: 28 });
    expect(result.payoffDate).toEqual({ year: 2027, month: 12, day: 31 });
  });

  it('rejects invalid input with a specific message', () => {
    expect(buildAmortization({ principal: 0, annualRatePercent: 5, termMonths: 12 }).ok).toBe(false);
    expect(buildAmortization({ principal: -1, annualRatePercent: 5, termMonths: 12 }).ok).toBe(false);
    expect(buildAmortization({ principal: 1000, annualRatePercent: -2, termMonths: 12 }).ok).toBe(
      false,
    );
    expect(buildAmortization({ principal: 1000, annualRatePercent: 5, termMonths: 0 }).ok).toBe(
      false,
    );
    expect(buildAmortization({ principal: 1000, annualRatePercent: 5, termMonths: 1.5 }).ok).toBe(
      false,
    );
  });

  it('refuses a term beyond the safe iteration cap rather than hanging', () => {
    const result = buildAmortization({
      principal: 1000,
      annualRatePercent: 5,
      termMonths: 12 * 101,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/100 years/);
  });

  it('computes the payment formula directly for a known case', () => {
    // 200,000 at 6% over 30 years is the textbook 1,199.10 payment.
    expect(round(monthlyPayment(200_000, 6, 360))).toBe(1199.1);
    expect(round(monthlyPayment(1200, 0, 12))).toBe(100);
  });
});

describe('mortgage calculator', () => {
  it('matches the worked example published on the mortgage page', () => {
    const result = calculateMortgage({
      homePrice: 420_000,
      downPayment: 63_000,
      annualRatePercent: 6.25,
      termMonths: 360,
      annualPropertyTax: 5040,
      annualHomeInsurance: 1450,
      monthlyHoa: 60,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.loanAmount).toBe(357_000);
    expect(round(result.loanToValuePercent, 1)).toBe(85);
    expect(round(result.downPaymentPercent, 1)).toBe(15);
    expect(round(result.principalAndInterest)).toBe(2198.11);
    expect(round(result.monthlyPropertyTax + result.monthlyInsurance + result.monthlyHoa)).toBe(
      600.83,
    );
    expect(round(result.totalMonthlyPayment)).toBe(2798.94);
    expect(Math.round(result.amortization.totalInterest)).toBe(434_320);
  });

  it('refuses a down payment at or above the home price', () => {
    const base = {
      homePrice: 300_000,
      annualRatePercent: 5,
      termMonths: 360,
      annualPropertyTax: 0,
      annualHomeInsurance: 0,
      monthlyHoa: 0,
    };
    expect(calculateMortgage({ ...base, downPayment: 300_000 }).ok).toBe(false);
    expect(calculateMortgage({ ...base, downPayment: 350_000 }).ok).toBe(false);
    expect(calculateMortgage({ ...base, downPayment: 299_999 }).ok).toBe(true);
  });

  it('rejects negative escrow components', () => {
    const base = {
      homePrice: 300_000,
      downPayment: 60_000,
      annualRatePercent: 5,
      termMonths: 360,
      annualPropertyTax: 0,
      annualHomeInsurance: 0,
      monthlyHoa: 0,
    };
    expect(calculateMortgage({ ...base, annualPropertyTax: -1 }).ok).toBe(false);
    expect(calculateMortgage({ ...base, monthlyHoa: -1 }).ok).toBe(false);
  });

  it('excludes escrow from the amortisation schedule', () => {
    const result = calculateMortgage({
      homePrice: 400_000,
      downPayment: 80_000,
      annualRatePercent: 6,
      termMonths: 360,
      annualPropertyTax: 6000,
      annualHomeInsurance: 1200,
      monthlyHoa: 100,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Escrow does not pay down the loan, so the schedule sums to the loan only.
    const principalPaid = result.amortization.schedule.reduce((sum, row) => sum + row.principal, 0);
    expect(round(principalPaid)).toBe(320_000);
  });
});

describe('compound interest', () => {
  it('matches the worked example published on the page', () => {
    const result = calculateCompoundInterest({
      principal: 10_000,
      annualRatePercent: 5,
      years: 10,
      compounding: 'monthly',
      contributionAmount: 300,
      contributionFrequency: 'monthly',
      contributionTiming: 'end',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(round(result.endingBalance)).toBe(63_054.78);
    expect(round(result.totalContributions)).toBe(36_000);
    expect(round(result.totalInterest)).toBe(17_054.78);
    expect(result.yearRows).toHaveLength(10);
  });

  it('matches the closed-form formula when there are no contributions', () => {
    const result = calculateCompoundInterest({
      principal: 10_000,
      annualRatePercent: 5,
      years: 10,
      compounding: 'annual',
      contributionAmount: 0,
      contributionFrequency: 'annual',
      contributionTiming: 'end',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(round(result.endingBalance)).toBe(round(10_000 * 1.05 ** 10));
  });

  it('gives beginning-of-period contributions exactly one extra period of interest', () => {
    const shared = {
      principal: 0,
      annualRatePercent: 6,
      years: 5,
      compounding: 'monthly' as const,
      contributionAmount: 100,
      contributionFrequency: 'monthly' as const,
    };
    const atEnd = calculateCompoundInterest({ ...shared, contributionTiming: 'end' });
    const atStart = calculateCompoundInterest({ ...shared, contributionTiming: 'beginning' });
    expect(atEnd.ok && atStart.ok).toBe(true);
    if (!atEnd.ok || !atStart.ok) return;

    expect(atStart.endingBalance).toBeGreaterThan(atEnd.endingBalance);
    // An annuity-due is an ordinary annuity multiplied by (1 + periodic rate).
    expect(round(atStart.endingBalance)).toBe(round(atEnd.endingBalance * (1 + 0.06 / 12)));
    expect(round(atStart.totalContributions)).toBe(round(atEnd.totalContributions));
  });

  it('supports a 0% rate, returning exactly principal plus contributions', () => {
    const result = calculateCompoundInterest({
      principal: 5000,
      annualRatePercent: 0,
      years: 3,
      compounding: 'monthly',
      contributionAmount: 100,
      contributionFrequency: 'monthly',
      contributionTiming: 'end',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(round(result.endingBalance)).toBe(5000 + 3600);
    expect(round(result.totalInterest)).toBe(0);
  });

  it('accepts a negative rate above −100% and rejects one at or below it', () => {
    const negative = calculateCompoundInterest({
      principal: 1000,
      annualRatePercent: -5,
      years: 2,
      compounding: 'annual',
      contributionAmount: 0,
      contributionFrequency: 'annual',
      contributionTiming: 'end',
    });
    expect(negative.ok).toBe(true);
    if (negative.ok) expect(round(negative.endingBalance)).toBe(round(1000 * 0.95 ** 2));

    const wipeout = calculateCompoundInterest({
      principal: 1000,
      annualRatePercent: -100,
      years: 2,
      compounding: 'annual',
      contributionAmount: 0,
      contributionFrequency: 'annual',
      contributionTiming: 'end',
    });
    expect(wipeout.ok).toBe(false);
  });

  it('models contributions on their own schedule, not as an annual lump sum', () => {
    // Weekly contributions into a monthly-compounding account must still total
    // 52 payments a year and must not be averaged into twelve.
    const result = calculateCompoundInterest({
      principal: 0,
      annualRatePercent: 4,
      years: 1,
      compounding: 'monthly',
      contributionAmount: 50,
      contributionFrequency: 'weekly',
      contributionTiming: 'end',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(round(result.totalContributions)).toBe(52 * 50);
    expect(result.endingBalance).toBeGreaterThan(52 * 50);
  });

  it('reconciles the yearly table against the totals', () => {
    const result = calculateCompoundInterest({
      principal: 2500,
      annualRatePercent: 7,
      years: 12,
      compounding: 'quarterly',
      contributionAmount: 400,
      contributionFrequency: 'quarterly',
      contributionTiming: 'end',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const contributions = result.yearRows.reduce((sum, row) => sum + row.contributions, 0);
    const interest = result.yearRows.reduce((sum, row) => sum + row.interest, 0);
    expect(round(contributions)).toBe(round(result.totalContributions));
    expect(round(interest)).toBe(round(result.totalInterest));
    expect(round(result.yearRows[result.yearRows.length - 1]?.closingBalance ?? 0)).toBe(
      round(result.endingBalance),
    );
    expect(round(result.startingPrincipal + contributions + interest)).toBe(
      round(result.endingBalance),
    );
  });

  it('shows daily compounding beating annual by a small margin', () => {
    const shared = {
      principal: 10_000,
      annualRatePercent: 5,
      years: 10,
      contributionAmount: 0,
      contributionFrequency: 'annual' as const,
      contributionTiming: 'end' as const,
    };
    const annual = calculateCompoundInterest({ ...shared, compounding: 'annual' });
    const daily = calculateCompoundInterest({ ...shared, compounding: 'daily' });
    expect(annual.ok && daily.ok).toBe(true);
    if (!annual.ok || !daily.ok) return;

    // Pins the exact figures quoted in the FAQ on the page.
    expect(round(annual.endingBalance)).toBe(16_288.95);
    expect(round(daily.endingBalance)).toBe(16_486.65);
    expect(round(daily.endingBalance - annual.endingBalance)).toBe(197.7);

    const monthly = calculateCompoundInterest({ ...shared, compounding: 'monthly' });
    expect(monthly.ok).toBe(true);
    if (monthly.ok) expect(round(monthly.endingBalance)).toBe(16_470.09);
  });
});

describe('salary converter', () => {
  it('matches the worked example published on the page', () => {
    const result = calculateSalary({
      amount: 62_000,
      frequency: 'annual',
      ...SALARY_DEFAULTS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(round(result.breakdown.hourly)).toBe(29.81);
    expect(round(result.breakdown.daily)).toBe(238.46);
    expect(round(result.breakdown.weekly)).toBe(1192.31);
    expect(round(result.breakdown.biweekly)).toBe(2384.62);
    expect(round(result.breakdown.semimonthly)).toBe(2583.33);
    expect(round(result.breakdown.monthly)).toBe(5166.67);
    expect(result.breakdown.annual).toBe(62_000);
  });

  it('keeps biweekly and semimonthly distinct', () => {
    const result = calculateSalary({ amount: 62_000, frequency: 'annual', ...SALARY_DEFAULTS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.breakdown.biweekly).not.toBe(result.breakdown.semimonthly);
    expect(round(result.breakdown.biweekly * 26)).toBe(62_000);
    expect(round(result.breakdown.semimonthly * 24)).toBe(62_000);
  });

  it('round-trips through every source frequency to the same annual figure', () => {
    const reference = calculateSalary({
      amount: 62_000,
      frequency: 'annual',
      ...SALARY_DEFAULTS,
    });
    expect(reference.ok).toBe(true);
    if (!reference.ok) return;

    for (const [frequency, amount] of Object.entries(reference.breakdown)) {
      const result = calculateSalary({
        amount,
        frequency: frequency as keyof typeof reference.breakdown,
        ...SALARY_DEFAULTS,
      });
      expect(result.ok, frequency).toBe(true);
      if (result.ok) expect(round(result.annualEquivalent), frequency).toBe(62_000);
    }
  });

  it('matches the documented hourly example of 30/hr = 62,400/yr', () => {
    const result = calculateSalary({ amount: 30, frequency: 'hourly', ...SALARY_DEFAULTS });
    expect(result.ok && result.annualEquivalent).toBe(62_400);
  });

  it('handles part-time patterns', () => {
    const result = calculateSalary({
      amount: 25,
      frequency: 'hourly',
      hoursPerWeek: 22,
      workdaysPerWeek: 3,
      paidWeeksPerYear: 52,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.annualEquivalent).toBe(25 * 22 * 52);
    expect(round(result.breakdown.daily)).toBe(round((25 * 22 * 52) / (3 * 52)));
  });

  it('lowers the annual figure when paid weeks are reduced, leaving weekly pay alone', () => {
    const full = calculateSalary({ amount: 1000, frequency: 'weekly', ...SALARY_DEFAULTS });
    const partial = calculateSalary({
      amount: 1000,
      frequency: 'weekly',
      ...SALARY_DEFAULTS,
      paidWeeksPerYear: 48,
    });
    expect(full.ok && partial.ok).toBe(true);
    if (!full.ok || !partial.ok) return;
    expect(full.annualEquivalent).toBe(52_000);
    expect(partial.annualEquivalent).toBe(48_000);
    expect(partial.breakdown.weekly).toBe(1000);
  });

  it('rejects impossible working patterns', () => {
    const base = { amount: 50_000, frequency: 'annual' as const, ...SALARY_DEFAULTS };
    expect(calculateSalary({ ...base, hoursPerWeek: 0 }).ok).toBe(false);
    expect(calculateSalary({ ...base, hoursPerWeek: 200 }).ok).toBe(false);
    expect(calculateSalary({ ...base, workdaysPerWeek: 8 }).ok).toBe(false);
    expect(calculateSalary({ ...base, paidWeeksPerYear: 60 }).ok).toBe(false);
    expect(calculateSalary({ ...base, amount: -1 }).ok).toBe(false);
  });
});
