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
import { calculateMortgage } from '@/lib/calculators/amortization';
import { formatMonthsAsYears } from '@/lib/formatting/number';
import type { CalendarDate } from '@/lib/date/calendar';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  formatNumber,
  parseNumericInput,
  type CurrencyCode,
} from '@/lib/formatting/number';

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.label}`,
}));

const DEFAULTS = {
  price: '420000',
  downAmount: '63000',
  rate: '6.25',
  years: '30',
  tax: '5040',
  insurance: '1450',
  hoa: '60',
  extra: '',
  currency: DEFAULT_CURRENCY,
};

export function MortgageCalculator() {
  const [price, setPrice] = useState(DEFAULTS.price);
  const [downAmount, setDownAmount] = useState(DEFAULTS.downAmount);
  const [rate, setRate] = useState(DEFAULTS.rate);
  const [years, setYears] = useState(DEFAULTS.years);
  const [tax, setTax] = useState(DEFAULTS.tax);
  const [insurance, setInsurance] = useState(DEFAULTS.insurance);
  const [hoa, setHoa] = useState(DEFAULTS.hoa);
  const [extra, setExtra] = useState(DEFAULTS.extra);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULTS.currency);
  const [startDate, setStartDate] = useState<CalendarDate | null>(null);

  const parsedPrice = parseNumericInput(price);
  const parsedDown = parseNumericInput(downAmount);

  /**
   * The down-payment amount and percentage stay synchronised (spec §6.3).
   * The amount is the stored value; the percentage is derived and writes back.
   */
  const downPercent =
    parsedPrice && parsedPrice > 0 && parsedDown !== null
      ? formatNumber((parsedDown / parsedPrice) * 100, 2)
      : '';

  function setDownFromPercent(raw: string) {
    const parsedPercent = parseNumericInput(raw);
    if (parsedPercent === null || parsedPrice === null || parsedPrice <= 0) return;
    setDownAmount(String(Number(((parsedPrice * parsedPercent) / 100).toFixed(2))));
  }

  const result = useMemo(() => {
    const parsedRate = parseNumericInput(rate);
    const parsedYears = parseNumericInput(years);
    const parsedTax = tax.trim() === '' ? 0 : parseNumericInput(tax);
    const parsedInsurance = insurance.trim() === '' ? 0 : parseNumericInput(insurance);
    const parsedHoa = hoa.trim() === '' ? 0 : parseNumericInput(hoa);
    const parsedExtra = extra.trim() === '' ? 0 : parseNumericInput(extra);

    if (
      parsedPrice === null ||
      parsedDown === null ||
      parsedRate === null ||
      parsedYears === null ||
      parsedTax === null ||
      parsedInsurance === null ||
      parsedHoa === null ||
      parsedExtra === null
    ) {
      return null;
    }

    return calculateMortgage({
      homePrice: parsedPrice,
      downPayment: parsedDown,
      annualRatePercent: parsedRate,
      termMonths: Math.round(parsedYears * 12),
      annualPropertyTax: parsedTax,
      annualHomeInsurance: parsedInsurance,
      monthlyHoa: parsedHoa,
      extraMonthlyPayment: parsedExtra,
      ...(startDate ? { startDate } : {}),
    });
  }, [parsedPrice, parsedDown, rate, years, tax, insurance, hoa, extra, startDate]);

  const money = (value: number) => formatCurrency(value, currency);

  function reset() {
    setPrice(DEFAULTS.price);
    setDownAmount(DEFAULTS.downAmount);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
    setTax(DEFAULTS.tax);
    setInsurance(DEFAULTS.insurance);
    setHoa(DEFAULTS.hoa);
    setExtra(DEFAULTS.extra);
    setCurrency(DEFAULTS.currency);
    setStartDate(null);
  }

  return (
    <>
      <CalculatorShell
        onReset={reset}
        results={
          <ResultPanel title="Mortgage estimate">
            {result === null ? (
              <ResultPlaceholder message="Enter a home price, deposit, rate and term." />
            ) : result.ok ? (
              <div className="space-y-4">
                <PrimaryResult
                  label="Estimated monthly payment"
                  value={money(result.totalMonthlyPayment)}
                  sub="Principal, interest, property tax, insurance and HOA combined."
                />

                <ResultList>
                  <ResultRow
                    label="Principal and interest"
                    value={money(result.principalAndInterest)}
                    emphasis
                  />
                  <ResultRow label="Property tax" value={money(result.monthlyPropertyTax)} />
                  <ResultRow label="Home insurance" value={money(result.monthlyInsurance)} />
                  <ResultRow label="HOA dues" value={money(result.monthlyHoa)} />
                </ResultList>

                <ResultList>
                  <ResultRow label="Loan amount" value={money(result.loanAmount)} />
                  <ResultRow
                    label="Loan-to-value"
                    value={`${formatNumber(result.loanToValuePercent, 1)}%`}
                    hint={
                      result.loanToValuePercent > 80
                        ? 'Above 80% many lenders require mortgage insurance, which is not calculated here'
                        : undefined
                    }
                  />
                  <ResultRow
                    label="Deposit"
                    value={`${money(parsedDown ?? 0)} (${formatNumber(result.downPaymentPercent, 1)}%)`}
                  />
                  <ResultRow
                    label="Total interest"
                    value={money(result.amortization.totalInterest)}
                  />
                  <ResultRow
                    label="Time to pay off"
                    value={formatMonthsAsYears(result.amortization.monthsToPayoff)}
                  />
                </ResultList>

                {result.amortization.savings && result.amortization.savings.monthsSaved > 0 ? (
                  <div className="rounded-md border border-success-border bg-success-surface p-3 text-sm">
                    <p className="font-medium">Your extra principal saves</p>
                    <p className="mt-1">
                      {money(result.amortization.savings.interestSaved)} in interest, clearing the
                      mortgage {formatMonthsAsYears(result.amortization.savings.monthsSaved)} early.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <InlineError message={result.error} />
            )}
          </ResultPanel>
        }
      >
        <NumberField
          label="Home price"
          value={price}
          onChange={setPrice}
          required
          error={price.trim() !== '' && parsedPrice === null ? 'Enter a number.' : null}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Down payment"
            value={downAmount}
            onChange={setDownAmount}
            required
            error={
              parsedPrice !== null && parsedDown !== null && parsedDown >= parsedPrice
                ? 'The down payment must be less than the home price.'
                : null
            }
          />
          <NumberField
            label="Down payment percent"
            value={downPercent}
            onChange={setDownFromPercent}
            unit="%"
            helper="Kept in step with the amount."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Interest rate" value={rate} onChange={setRate} unit="%" required />
          <NumberField label="Term" value={years} onChange={setYears} unit="yrs" required />
        </div>

        <SelectField
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={CURRENCY_OPTIONS}
        />

        <fieldset className="border-t border-border-default pt-4">
          <legend className="text-sm font-medium">Recurring costs</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <NumberField label="Property tax" value={tax} onChange={setTax} unit="/yr" />
            <NumberField label="Home insurance" value={insurance} onChange={setInsurance} unit="/yr" />
            <NumberField label="HOA dues" value={hoa} onChange={setHoa} unit="/mo" />
          </div>
          <p className="mt-2 text-xs text-muted">
            Assumed constant for the whole term. In practice tax and insurance usually rise.
          </p>
        </fieldset>

        <NumberField
          label="Extra monthly principal (optional)"
          value={extra}
          onChange={setExtra}
        />

        <DateField
          label="First payment date (optional)"
          value={startDate}
          onChange={setStartDate}
        />
      </CalculatorShell>

      {result?.ok ? (
        <AmortizationSchedule
          schedule={result.amortization.schedule}
          yearSummaries={result.amortization.yearSummaries}
          currency={currency}
          filename="mortgage"
        />
      ) : null}
    </>
  );
}
