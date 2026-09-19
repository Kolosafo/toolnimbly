'use client';

import { useMemo, useState } from 'react';

import { GrowthChart, type GrowthBar } from '@/components/charts/growth-chart';
import { InlineError } from '@/components/feedback/inline-error';
import { NumberField } from '@/components/forms/number-field';
import { SegmentedControl } from '@/components/forms/segmented-control';
import { SelectField } from '@/components/forms/select-field';
import { DataTable } from '@/components/tables/data-table';
import {
  CalculatorShell,
  PrimaryResult,
  ResultList,
  ResultPanel,
  ResultPlaceholder,
  ResultRow,
} from '@/components/tool-shell/calculator-shell';
import {
  calculateCompoundInterest,
  COMPOUNDING_FREQUENCIES,
  CONTRIBUTION_FREQUENCIES,
  type CompoundingFrequency,
  type ContributionFrequency,
  type ContributionTiming,
} from '@/lib/calculators/compound-interest';
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  parseNumericInput,
  type CurrencyCode,
} from '@/lib/formatting/number';

const CURRENCY_OPTIONS = CURRENCIES.map((currency) => ({
  value: currency.code,
  label: `${currency.code} — ${currency.label}`,
}));

const COMPOUNDING_OPTIONS = (Object.keys(COMPOUNDING_FREQUENCIES) as CompoundingFrequency[]).map(
  (value) => ({ value, label: COMPOUNDING_FREQUENCIES[value].label }),
);

const CONTRIBUTION_OPTIONS = (Object.keys(CONTRIBUTION_FREQUENCIES) as ContributionFrequency[]).map(
  (value) => ({ value, label: CONTRIBUTION_FREQUENCIES[value].label }),
);

const TIMING_OPTIONS = [
  {
    value: 'end' as const,
    label: 'End of period',
    description: 'Matches a salary deduction landing on payday',
  },
  {
    value: 'beginning' as const,
    label: 'Beginning of period',
    description: 'Earns one extra period of interest',
  },
];

const DEFAULTS = {
  principal: '10000',
  rate: '5',
  years: '10',
  compounding: 'monthly' as CompoundingFrequency,
  contribution: '300',
  contributionFrequency: 'monthly' as ContributionFrequency,
  timing: 'end' as ContributionTiming,
  currency: DEFAULT_CURRENCY,
};

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState(DEFAULTS.principal);
  const [rate, setRate] = useState(DEFAULTS.rate);
  const [years, setYears] = useState(DEFAULTS.years);
  const [compounding, setCompounding] = useState<CompoundingFrequency>(DEFAULTS.compounding);
  const [contribution, setContribution] = useState(DEFAULTS.contribution);
  const [contributionFrequency, setContributionFrequency] = useState<ContributionFrequency>(
    DEFAULTS.contributionFrequency,
  );
  const [timing, setTiming] = useState<ContributionTiming>(DEFAULTS.timing);
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULTS.currency);

  const result = useMemo(() => {
    const parsedPrincipal = parseNumericInput(principal);
    const parsedRate = parseNumericInput(rate);
    const parsedYears = parseNumericInput(years);
    const parsedContribution = contribution.trim() === '' ? 0 : parseNumericInput(contribution);

    if (
      parsedPrincipal === null ||
      parsedRate === null ||
      parsedYears === null ||
      parsedContribution === null
    ) {
      return null;
    }

    return calculateCompoundInterest({
      principal: parsedPrincipal,
      annualRatePercent: parsedRate,
      years: parsedYears,
      compounding,
      contributionAmount: parsedContribution,
      contributionFrequency,
      contributionTiming: timing,
    });
  }, [principal, rate, years, compounding, contribution, contributionFrequency, timing]);

  const money = (value: number) => formatCurrency(value, currency);

  const bars: GrowthBar[] = useMemo(() => {
    if (result?.ok !== true) return [];
    let cumulativeContributions = 0;
    let cumulativeInterest = 0;
    return result.yearRows.map((row) => {
      cumulativeContributions += row.contributions;
      cumulativeInterest += row.interest;
      return {
        label: `Year ${row.year}`,
        principal: result.startingPrincipal,
        contributions: cumulativeContributions,
        interest: cumulativeInterest,
        total: row.closingBalance,
      };
    });
  }, [result]);

  function reset() {
    setPrincipal(DEFAULTS.principal);
    setRate(DEFAULTS.rate);
    setYears(DEFAULTS.years);
    setCompounding(DEFAULTS.compounding);
    setContribution(DEFAULTS.contribution);
    setContributionFrequency(DEFAULTS.contributionFrequency);
    setTiming(DEFAULTS.timing);
    setCurrency(DEFAULTS.currency);
  }

  return (
    <>
      <CalculatorShell
        onReset={reset}
        results={
          <ResultPanel title="Projection result">
            {result === null ? (
              <ResultPlaceholder message="Enter a starting amount, rate and duration." />
            ) : result.ok ? (
              <div className="space-y-4">
                <PrimaryResult
                  label="Projected balance"
                  value={money(result.endingBalance)}
                  sub="A projection at a constant rate, not a forecast or a guarantee."
                />

                <ResultList>
                  <ResultRow label="Starting amount" value={money(result.startingPrincipal)} />
                  <ResultRow label="Total contributions" value={money(result.totalContributions)} />
                  <ResultRow label="Total interest earned" value={money(result.totalInterest)} emphasis />
                  <ResultRow
                    label="Interest as a share of the balance"
                    // With nothing invested and nothing contributed the balance
                    // is zero, and the share is 0/0. There is no share of
                    // nothing, so say so rather than printing NaN.
                    value={
                      result.endingBalance.valueOf() > 0
                        ? `${((result.totalInterest / result.endingBalance) * 100).toFixed(1)}%`
                        : '—'
                    }
                  />
                </ResultList>
              </div>
            ) : (
              <InlineError message={result.error} />
            )}
          </ResultPanel>
        }
      >
        <NumberField label="Starting amount" value={principal} onChange={setPrincipal} required />

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Annual rate" value={rate} onChange={setRate} unit="%" required />
          <NumberField label="Duration" value={years} onChange={setYears} unit="yrs" required />
        </div>

        <SelectField
          label="Compounding frequency"
          value={compounding}
          onChange={setCompounding}
          options={COMPOUNDING_OPTIONS}
        />

        <SelectField
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={CURRENCY_OPTIONS}
        />

        <fieldset className="border-t border-border-default pt-4">
          <legend className="text-sm font-medium">Regular contributions</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <NumberField label="Amount" value={contribution} onChange={setContribution} />
            <SelectField
              label="How often"
              value={contributionFrequency}
              onChange={setContributionFrequency}
              options={CONTRIBUTION_OPTIONS}
            />
          </div>
          <div className="mt-4">
            <SegmentedControl
              legend="Contribution timing"
              value={timing}
              onChange={setTiming}
              options={TIMING_OPTIONS}
              columns="stack"
            />
          </div>
        </fieldset>
      </CalculatorShell>

      {result?.ok ? (
        <div className="mt-8">
          <GrowthChart bars={bars} currency={currency} title="Balance composition by year" />

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Year-by-year breakdown</h3>
            <div className="mt-3">
              <DataTable
                caption="Opening balance, contributions, interest and closing balance for each year"
                rows={result.yearRows}
                rowKey={(row) => String(row.year)}
                initialRowLimit={15}
                columns={[
                  { header: 'Year', cell: (row) => row.year, numeric: true },
                  { header: 'Opening', cell: (row) => money(row.openingBalance), numeric: true },
                  { header: 'Contributions', cell: (row) => money(row.contributions), numeric: true },
                  { header: 'Interest', cell: (row) => money(row.interest), numeric: true },
                  { header: 'Closing', cell: (row) => money(row.closingBalance), numeric: true },
                ]}
                csvColumns={[
                  { header: 'Year', value: (row) => row.year },
                  { header: 'Opening balance', value: (row) => row.openingBalance.toFixed(2) },
                  { header: 'Contributions', value: (row) => row.contributions.toFixed(2) },
                  { header: 'Interest earned', value: (row) => row.interest.toFixed(2) },
                  { header: 'Closing balance', value: (row) => row.closingBalance.toFixed(2) },
                ]}
                csvFilename="compound-interest-projection"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
