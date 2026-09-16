'use client';

import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { InlineError } from '@/components/feedback/inline-error';
import { NumberField } from '@/components/forms/number-field';
import { SegmentedControl } from '@/components/forms/segmented-control';
import {
  CalculatorShell,
  PrimaryResult,
  ResultList,
  ResultPanel,
  ResultPlaceholder,
  ResultRow,
} from '@/components/tool-shell/calculator-shell';
import {
  BMI_THRESHOLDS,
  calculateBmi,
  feetInchesToCentimetres,
  poundsToKilograms,
  type BmiCategory,
  type UnitSystem,
} from '@/lib/calculators/health';
import { formatNumber, parseNumericInput } from '@/lib/formatting/number';

const UNIT_OPTIONS = [
  { value: 'metric' as const, label: 'Metric', description: 'Kilograms and centimetres' },
  { value: 'imperial' as const, label: 'US customary', description: 'Pounds, feet and inches' },
];

/** Category styling always pairs colour with the written label (spec §5.5). */
const CATEGORY_STYLES: Record<BmiCategory, string> = {
  underweight: 'border-info-border bg-info-surface',
  healthy: 'border-success-border bg-success-surface',
  overweight: 'border-warning-border bg-warning-surface',
  obesity: 'border-danger-border bg-danger-surface',
};

export function BmiCalculator() {
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [age, setAge] = useState('');

  const result = useMemo(() => {
    const parsedWeight = parseNumericInput(weight);
    if (parsedWeight === null) return null;

    const weightKg = units === 'metric' ? parsedWeight : poundsToKilograms(parsedWeight);

    let height: number | null = null;
    if (units === 'metric') {
      height = parseNumericInput(heightCm);
    } else {
      const parsedFeet = parseNumericInput(feet);
      const parsedInches = parseNumericInput(inches) ?? 0;
      if (parsedFeet !== null) height = feetInchesToCentimetres(parsedFeet, parsedInches);
    }
    if (height === null) return null;

    const parsedAge = parseNumericInput(age);
    return calculateBmi({ weightKg, heightCm: height, age: parsedAge });
  }, [units, weight, heightCm, feet, inches, age]);

  function reset() {
    setUnits('metric');
    setWeight('');
    setHeightCm('');
    setFeet('');
    setInches('');
    setAge('');
  }

  const rangeKg = result?.ok === true ? result.healthyWeightRangeKg : null;
  const rangeLb = result?.ok === true ? result.healthyWeightRangeLb : null;
  const range =
    units === 'metric'
      ? rangeKg && `${formatNumber(rangeKg.min, 1)}–${formatNumber(rangeKg.max, 1)} kg`
      : rangeLb && `${formatNumber(rangeLb.min, 1)}–${formatNumber(rangeLb.max, 1)} lb`;

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="BMI result">
          {result === null ? (
            <ResultPlaceholder message="Enter a height and weight to calculate BMI." />
          ) : result.ok ? (
            <div className="space-y-4">
              <PrimaryResult
                label="Body mass index"
                value={formatNumber(result.bmi, 1)}
                sub={result.categoryLabel ?? 'Category not shown — see the note below.'}
              />

              {result.category ? (
                <p
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${CATEGORY_STYLES[result.category]}`}
                >
                  {result.categoryLabel}
                </p>
              ) : null}

              {result.categoryNote ? (
                <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
                  {result.categoryNote}
                </p>
              ) : null}

              {range ? (
                <ResultList>
                  <ResultRow label="Healthy weight range for this height" value={range} emphasis />
                  <ResultRow
                    label="Healthy BMI band"
                    value={`${BMI_THRESHOLDS.underweightBelow} – 24.9`}
                  />
                </ResultList>
              ) : null}

              <CopyButton value={`BMI ${formatNumber(result.bmi, 1)}`} label="Copy BMI" />
            </div>
          ) : (
            <InlineError message={result.error} />
          )}
        </ResultPanel>
      }
    >
      <SegmentedControl legend="Units" value={units} onChange={setUnits} options={UNIT_OPTIONS} />

      {units === 'metric' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Weight" value={weight} onChange={setWeight} unit="kg" required />
          <NumberField label="Height" value={heightCm} onChange={setHeightCm} unit="cm" required />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Weight" value={weight} onChange={setWeight} unit="lb" required />
          <NumberField label="Height (feet)" value={feet} onChange={setFeet} unit="ft" required />
          <NumberField label="Height (inches)" value={inches} onChange={setInches} unit="in" />
        </div>
      )}

      <NumberField
        label="Age (optional)"
        value={age}
        onChange={setAge}
        unit="yrs"
        helper="Used only to check whether adult categories apply. Below 20 they do not."
      />
    </CalculatorShell>
  );
}
