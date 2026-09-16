'use client';

import { useMemo, useState } from 'react';

import { InlineError } from '@/components/feedback/inline-error';
import { DateField } from '@/components/forms/date-field';
import { NumberField } from '@/components/forms/number-field';
import { SelectField } from '@/components/forms/select-field';
import {
  CalculatorShell,
  PrimaryResult,
  ResultList,
  ResultPanel,
  ResultPlaceholder,
  ResultRow,
} from '@/components/tool-shell/calculator-shell';
import { AmortizationSchedule } from '@/components/tools/calculators/amortization-schedule';
import { buildAmortization } from '@/lib/calculators/amortization';
import { formatLongDate, type CalendarDate } from '@/lib/date/calendar';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatMonthsAsYears,
  parseNumericInput,
  type CurrencyCode,
} from '@/lib/formatting/number';

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.label}`,
}));

const TERM_UNITS = [
  { value: 'years' as const, label: 'Years' },
  { value: 'months' as const, label: 'Months' },
];

const DEFAULTS = {
  principal: '25000',
  rate: '7.5',
  term: '5',
  termUnit: 'years' as const,
  extra: '',
  currency: DEFAULT_CURRENCY,
};

export function LoanCalculator() {
  const [principal, setPrincipal] = useState(DEFAULTS.principal);
  const [rate, setRate] = useState(DEFAULTS.rate);
  const [term, setTerm] = useState(DEFAULTS.term);
  const [termUnit, setTermUnit] = useState<'years' | 'months'>(DEFAULTS.termUnit);
  const [extra, setExtra] = useState(DEFAULTS.extra);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULTS.currency);
  const [startDate, setStartDate] = useState<CalendarDate | null>(null);

  const parsedPrincipal = parseNumericInput(principal);
  const parsedRate = parseNumericInput(rate);
  const parsedTerm = parseNumericInput(term);
  const parsedExtra = extra.trim() === '' ? 0 : parseNumericInput(extra);

  const result = useMemo(() => {
    if (parsedPrincipal === null || parsedRate === null || parsedTerm === null) return null;
    if (parsedExtra === null) return null;

    const termMonths = termUnit === 'years' ? Math.round(parsedTerm * 12) : Math.round(parsedTerm);

    return buildAmortization({
      principal: parsedPrincipal,
      annualRatePercent: parsedRate,
      termMonths,
      extraMonthlyPayment: parsedExtra,
      ...(startDate ? { startDate } : {}),
    });
  }, [parsedPrincipal, parsedRate, parsedTerm, parsedExtra, termUnit, startDate]);

  const money = (value: number) => formatCurrency(value, currency);

  function reset() {
    setPrincipal(DEFAULTS.principal);
    setRate(DEFAULTS.rate);
    setTerm(DEFAULTS.term);
    setTermUnit(DEFAULTS.termUnit);
    setExtra(DEFAULTS.extra);
    setCurrency(DEFAULTS.currency);
    setStartDate(null);
  }

  return (
    <>
      <CalculatorShell
        onReset={reset}
        results={
          <ResultPanel title="Loan result">
            {result === null ? (
              <ResultPlaceholder message="Enter an amount, rate and term to see the payment." />
            ) : result.ok ? (
              <div className="space-y-4">
                <PrimaryResult
                  label="Monthly payment"
                  value={money(result.scheduledPayment)}
                  sub={
                    parsedExtra && parsedExtra > 0
                      ? `Plus ${money(parsedExtra)} extra, so ${money(result.totalMonthlyPayment)} a month in total.`
                      : undefined
                  }
                />

                <ResultList>
                  <ResultRow label="Total principal" value={money(parsedPrincipal ?? 0)} />
                  <ResultRow label="Total interest" value={money(result.totalInterest)} />
                  <ResultRow label="Total paid" value={money(result.totalPaid)} emphasis />
                  <ResultRow
                    label="Time to pay off"
                    value={formatMonthsAsYears(result.monthsToPayoff)}
                  />
                  {result.payoffDate ? (
                    <ResultRow label="Final payment" value={formatLongDate(result.payoffDate)} />
                  ) : null}
                </ResultList>

                {result.savings && result.savings.monthsSaved > 0 ? (
                  <div className="rounded-md border border-success-border bg-success-surface p-3 text-sm">
                    <p className="font-medium">Your extra payment saves</p>
                    <p className="mt-1">
                      {money(result.savings.interestSaved)} in interest, and clears the loan{' '}
                      {formatMonthsAsYears(result.savings.monthsSaved)} early.
                    </p>
                  </div>
                ) : null}

                {result.warnings.map((warning) => (
                  <p
                    key={warning}
                    className="rounded-md border border-warning-border bg-warning-surface px-3 py-2 text-sm"
                  >
                    {warning}
                  </p>
                ))}
              </div>
            ) : (
              <InlineError message={result.error} />
            )}
          </ResultPanel>
        }
      >
        <NumberField
          label="Loan amount"
          value={principal}
          onChange={setPrincipal}
          required
          error={principal.trim() !== '' && parsedPrincipal === null ? 'Enter a number.' : null}
        />

        <NumberField
          label="Annual interest rate"
          value={rate}
          onChange={setRate}
          unit="%"
          required
          error={rate.trim() !== '' && parsedRate === null ? 'Enter a number.' : null}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Term"
            value={term}
            onChange={setTerm}
            required
            error={term.trim() !== '' && parsedTerm === null ? 'Enter a number.' : null}
          />
          <SelectField label="Term unit" value={termUnit} onChange={setTermUnit} options={TERM_UNITS} />
        </div>

        <SelectField
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={CURRENCY_OPTIONS}
        />

        <NumberField
          label="Extra monthly payment (optional)"
          value={extra}
          onChange={setExtra}
          helper="Applied to principal every month on top of the scheduled payment."
          error={extra.trim() !== '' && parsedExtra === null ? 'Enter a number.' : null}
        />

        <DateField
          label="First payment date (optional)"
          value={startDate}
          onChange={setStartDate}
          helper="Only labels the schedule with real dates. It does not change any amount."
        />
      </CalculatorShell>

      {result?.ok ? (
        <AmortizationSchedule
          schedule={result.schedule}
          yearSummaries={result.yearSummaries}
          currency={currency}
          filename="loan"
        />
      ) : null}
    </>
  );
}
