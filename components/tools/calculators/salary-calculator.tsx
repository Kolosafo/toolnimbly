'use client';

import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { InlineError } from '@/components/feedback/inline-error';
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
import {
  calculateSalary,
  PAY_FREQUENCIES,
  SALARY_DEFAULTS,
  type PayFrequency,
} from '@/lib/calculators/salary';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatNumber,
  parseNumericInput,
  type CurrencyCode,
} from '@/lib/formatting/number';

const FREQUENCY_OPTIONS = (Object.keys(PAY_FREQUENCIES) as PayFrequency[]).map((value) => ({
  value,
  label: PAY_FREQUENCIES[value],
}));

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.label}`,
}));

const ROWS: { key: PayFrequency; label: string; hint?: string }[] = [
  { key: 'hourly', label: 'Hourly' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Biweekly', hint: '26 pay periods a year' },
  { key: 'semimonthly', label: 'Semimonthly', hint: '24 pay periods a year' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'annual', label: 'Annual' },
];

const DEFAULTS = {
  amount: '62000',
  frequency: 'annual' as PayFrequency,
  hours: String(SALARY_DEFAULTS.hoursPerWeek),
  days: String(SALARY_DEFAULTS.workdaysPerWeek),
  weeks: String(SALARY_DEFAULTS.paidWeeksPerYear),
  currency: DEFAULT_CURRENCY,
};

export function SalaryCalculator() {
  const [amount, setAmount] = useState(DEFAULTS.amount);
  const [frequency, setFrequency] = useState<PayFrequency>(DEFAULTS.frequency);
  const [hours, setHours] = useState(DEFAULTS.hours);
  const [days, setDays] = useState(DEFAULTS.days);
  const [weeks, setWeeks] = useState(DEFAULTS.weeks);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULTS.currency);

  const parsedAmount = parseNumericInput(amount);
  const parsedHours = parseNumericInput(hours);
  const parsedDays = parseNumericInput(days);
  const parsedWeeks = parseNumericInput(weeks);

  const result = useMemo(() => {
    if (parsedAmount === null || parsedHours === null || parsedDays === null || parsedWeeks === null) {
      return null;
    }
    return calculateSalary({
      amount: parsedAmount,
      frequency,
      hoursPerWeek: parsedHours,
      workdaysPerWeek: parsedDays,
      paidWeeksPerYear: parsedWeeks,
    });
  }, [parsedAmount, frequency, parsedHours, parsedDays, parsedWeeks]);

  const copyText =
    result?.ok === true
      ? ROWS.map(
          (row) => `${row.label}: ${formatCurrency(result.breakdown[row.key], currency)}`,
        ).join('\n')
      : '';

  function reset() {
    setAmount(DEFAULTS.amount);
    setFrequency(DEFAULTS.frequency);
    setHours(DEFAULTS.hours);
    setDays(DEFAULTS.days);
    setWeeks(DEFAULTS.weeks);
    setCurrency(DEFAULTS.currency);
  }

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="Pay equivalents">
          {result === null ? (
            <ResultPlaceholder message="Enter a pay amount to see the equivalents." />
          ) : result.ok ? (
            <div className="space-y-4">
              <PrimaryResult
                label="Annual gross pay"
                value={formatCurrency(result.annualEquivalent, currency)}
                sub={`Based on ${formatNumber(result.totalHoursPerYear, 0)} paid hours a year. Gross pay, before any deductions.`}
              />

              <ResultList>
                {ROWS.map((row) => (
                  <ResultRow
                    key={row.key}
                    label={row.label}
                    value={formatCurrency(result.breakdown[row.key], currency)}
                    emphasis={row.key === frequency}
                    {...(row.hint ? { hint: row.hint } : {})}
                  />
                ))}
              </ResultList>

              <CopyButton value={copyText} label="Copy all equivalents" />
            </div>
          ) : (
            <InlineError message={result.error} />
          )}
        </ResultPanel>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Pay amount"
          value={amount}
          onChange={setAmount}
          required
          error={amount.trim() !== '' && parsedAmount === null ? 'Enter a number.' : null}
        />
        <SelectField
          label="This amount is"
          value={frequency}
          onChange={setFrequency}
          options={FREQUENCY_OPTIONS}
        />
      </div>

      <SelectField
        label="Currency"
        value={currency}
        onChange={setCurrency}
        options={CURRENCY_OPTIONS}
      />

      <fieldset className="border-t border-border-default pt-4">
        <legend className="text-sm font-medium">Your working pattern</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <NumberField
            label="Hours per week"
            value={hours}
            onChange={setHours}
            unit="hrs"
            error={hours.trim() !== '' && parsedHours === null ? 'Enter a number.' : null}
          />
          <NumberField
            label="Workdays per week"
            value={days}
            onChange={setDays}
            unit="days"
            error={days.trim() !== '' && parsedDays === null ? 'Enter a number.' : null}
          />
          <NumberField
            label="Paid weeks per year"
            value={weeks}
            onChange={setWeeks}
            unit="wks"
            error={weeks.trim() !== '' && parsedWeeks === null ? 'Enter a number.' : null}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          Salaried with paid holiday? Leave paid weeks at 52. Taking unpaid leave? Subtract those
          weeks.
        </p>
      </fieldset>
    </CalculatorShell>
  );
}
