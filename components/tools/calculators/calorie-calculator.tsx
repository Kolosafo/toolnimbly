'use client';

import { TriangleAlert } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { InlineError } from '@/components/feedback/inline-error';
import { NumberField } from '@/components/forms/number-field';
import { SegmentedControl } from '@/components/forms/segmented-control';
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
  ACTIVITY_LEVELS,
  calculateCalories,
  feetInchesToCentimetres,
  poundsToKilograms,
  type ActivityLevel,
  type EquationSex,
  type UnitSystem,
} from '@/lib/calculators/health';
import { formatInteger, parseNumericInput } from '@/lib/formatting/number';

const UNIT_OPTIONS = [
  { value: 'metric' as const, label: 'Metric', description: 'Kilograms and centimetres' },
  { value: 'imperial' as const, label: 'US customary', description: 'Pounds, feet and inches' },
];

const SEX_OPTIONS = [
  { value: 'male' as const, label: 'Male equation', description: '10W + 6.25H − 5A + 5' },
  { value: 'female' as const, label: 'Female equation', description: '10W + 6.25H − 5A − 161' },
];

const ACTIVITY_OPTIONS = (Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((value) => ({
  value,
  label: `${ACTIVITY_LEVELS[value].label} (×${ACTIVITY_LEVELS[value].multiplier}) — ${ACTIVITY_LEVELS[value].description}`,
}));

export function CalorieCalculator() {
  const [units, setUnits] = useState<UnitSystem>('metric');
  const [sex, setSex] = useState<EquationSex>('male');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');

  const result = useMemo(() => {
    const parsedAge = parseNumericInput(age);
    const parsedWeight = parseNumericInput(weight);
    if (parsedAge === null || parsedWeight === null) return null;

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

    return calculateCalories({ weightKg, heightCm: height, age: parsedAge, sex, activity });
  }, [units, sex, activity, age, weight, heightCm, feet, inches]);

  function reset() {
    setUnits('metric');
    setSex('male');
    setActivity('moderate');
    setAge('');
    setWeight('');
    setHeightCm('');
    setFeet('');
    setInches('');
  }

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="Calorie estimate">
          {result === null ? (
            <ResultPlaceholder message="Enter age, height and weight to see an estimate." />
          ) : result.ok ? (
            <div className="space-y-4">
              <PrimaryResult
                label="Estimated maintenance calories"
                value={`${formatInteger(Math.round(result.tdee))} kcal`}
                sub={`Resting metabolic rate ${formatInteger(Math.round(result.bmr))} kcal, multiplied by ${ACTIVITY_LEVELS[activity].multiplier} for ${ACTIVITY_LEVELS[activity].label.toLowerCase()}.`}
              />

              <ResultList>
                {result.targets.map((target) => (
                  <ResultRow
                    key={target.key}
                    label={target.label}
                    value={`${formatInteger(Math.round(target.calories))} kcal`}
                    emphasis={target.key === 'maintain'}
                    {...(target.belowSafeFloor
                      ? { hint: 'Below the safe self-directed floor — see the warning below' }
                      : {})}
                  />
                ))}
              </ResultList>

              {result.safetyWarning ? (
                <p className="flex items-start gap-2 rounded-md border border-danger-border bg-danger-surface px-3 py-2 text-sm">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                  <span>{result.safetyWarning}</span>
                </p>
              ) : null}

              <CopyButton
                value={`BMR ${Math.round(result.bmr)} kcal, maintenance ${Math.round(result.tdee)} kcal`}
                label="Copy estimate"
              />
            </div>
          ) : (
            <InlineError message={result.error} />
          )}
        </ResultPanel>
      }
    >
      <SegmentedControl legend="Units" value={units} onChange={setUnits} options={UNIT_OPTIONS} />

      <SegmentedControl
        legend="Equation variant"
        value={sex}
        onChange={setSex}
        options={SEX_OPTIONS}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Age"
          value={age}
          onChange={setAge}
          unit="yrs"
          required
          helper="Adults 18–100"
        />
        <NumberField
          label="Weight"
          value={weight}
          onChange={setWeight}
          unit={units === 'metric' ? 'kg' : 'lb'}
          required
        />
      </div>

      {units === 'metric' ? (
        <NumberField label="Height" value={heightCm} onChange={setHeightCm} unit="cm" required />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Height (feet)" value={feet} onChange={setFeet} unit="ft" required />
          <NumberField label="Height (inches)" value={inches} onChange={setInches} unit="in" />
        </div>
      )}

      <SelectField
        label="Activity level"
        value={activity}
        onChange={setActivity}
        options={ACTIVITY_OPTIONS}
        helper="If you are between two levels, choose the lower one. Most people overestimate here."
      />
    </CalculatorShell>
  );
}
