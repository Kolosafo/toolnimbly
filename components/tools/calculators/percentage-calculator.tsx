'use client';

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
import { calculatePercentage, type PercentageMode } from '@/lib/calculators/percentage';
import { formatNumber, parseNumericInput } from '@/lib/formatting/number';

const MODES = [
  {
    value: 'percentOf' as const,
    label: 'What is X% of Y?',
    description: 'Find a percentage of a number',
  },
  {
    value: 'isWhatPercent' as const,
    label: 'X is what percent of Y?',
    description: 'Express one number as a share of another',
  },
  {
    value: 'percentChange' as const,
    label: 'Percentage change',
    description: 'Compare a starting and an ending value',
  },
];

const FIELD_LABELS: Record<PercentageMode, { x: string; y: string; xUnit?: string }> = {
  percentOf: { x: 'Percentage', y: 'Of this number', xUnit: '%' },
  isWhatPercent: { x: 'This number', y: 'Is what percent of' },
  percentChange: { x: 'Starting value', y: 'Ending value' },
};

const PRECISION_OPTIONS = Array.from({ length: 11 }, (_, index) => ({
  value: String(index),
  label: index === 0 ? '0 (whole numbers)' : `${index}`,
}));

const DEFAULTS = { mode: 'percentOf' as PercentageMode, x: '15', y: '68.40', precision: '2' };

export function PercentageCalculator() {
  const [mode, setMode] = useState<PercentageMode>(DEFAULTS.mode);
  const [x, setX] = useState(DEFAULTS.x);
  const [y, setY] = useState(DEFAULTS.y);
  const [precision, setPrecision] = useState(DEFAULTS.precision);

  const decimals = Number(precision);
  const parsedX = parseNumericInput(x);
  const parsedY = parseNumericInput(y);
  const labels = FIELD_LABELS[mode];

  const result = useMemo(() => {
    if (parsedX === null || parsedY === null) return null;
    return calculatePercentage(mode, parsedX, parsedY);
  }, [mode, parsedX, parsedY]);

  const displayValue =
    result?.ok === true ? formatNumber(result.value, decimals) : null;
  const copyValue = result?.ok === true ? String(Number(result.value.toFixed(decimals))) : '';

  function reset() {
    setMode(DEFAULTS.mode);
    setX(DEFAULTS.x);
    setY(DEFAULTS.y);
    setPrecision(DEFAULTS.precision);
  }

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="Percentage result">
          {result === null ? (
            <ResultPlaceholder message="Enter both numbers to see the result." />
          ) : result.ok ? (
            <div className="space-y-4">
              <PrimaryResult
                label={mode === 'percentOf' ? 'Result' : 'Percentage'}
                value={mode === 'percentOf' ? (displayValue ?? '—') : `${displayValue}%`}
                sub={result.interpretation}
              />

              <div className="overflow-x-auto rounded-md border border-border-default bg-surface p-3">
                <p className="font-mono text-sm whitespace-nowrap">{result.equation}</p>
              </div>

              <ResultList>
                {result.extras.map((extra) => (
                  <ResultRow
                    key={extra.label}
                    label={extra.label}
                    value={
                      mode === 'isWhatPercent'
                        ? `${formatNumber(extra.value, decimals)}%`
                        : formatNumber(extra.value, decimals)
                    }
                  />
                ))}
              </ResultList>

              <CopyButton value={copyValue} label="Copy result" />
            </div>
          ) : (
            <InlineError message={result.error} />
          )}
        </ResultPanel>
      }
    >
      <SegmentedControl
        legend="What do you want to work out?"
        value={mode}
        onChange={setMode}
        options={MODES}
        columns="stack"
      />

      <NumberField
        label={labels.x}
        value={x}
        onChange={setX}
        {...(labels.xUnit ? { unit: labels.xUnit } : {})}
        error={x.trim() !== '' && parsedX === null ? 'Enter a number.' : null}
      />

      <NumberField
        label={labels.y}
        value={y}
        onChange={setY}
        error={y.trim() !== '' && parsedY === null ? 'Enter a number.' : null}
      />

      <SelectField
        label="Decimal places shown"
        value={precision}
        onChange={setPrecision}
        options={PRECISION_OPTIONS}
        helper="Rounding affects the display only. The full value is kept internally."
      />
    </CalculatorShell>
  );
}
