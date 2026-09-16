'use client';

import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { InlineError } from '@/components/feedback/inline-error';
import { DateField } from '@/components/forms/date-field';
import {
  CalculatorShell,
  PrimaryResult,
  ResultList,
  ResultPanel,
  ResultPlaceholder,
  ResultRow,
} from '@/components/tool-shell/calculator-shell';
import { calculateAge } from '@/lib/calculators/age';
import { formatLongDate, todayLocal, type CalendarDate } from '@/lib/date/calendar';
import { formatInteger } from '@/lib/formatting/number';

export function AgeCalculator() {
  // `todayLocal` reads local calendar fields only, so this is stable for the
  // session and never shifts the selected date by a timezone.
  const [today] = useState<CalendarDate>(() => todayLocal());
  const [birthDate, setBirthDate] = useState<CalendarDate | null>(null);
  const [onDate, setOnDate] = useState<CalendarDate | null>(today);

  const result = useMemo(() => {
    if (!birthDate || !onDate) return null;
    return calculateAge(birthDate, onDate);
  }, [birthDate, onDate]);

  const summary =
    result?.ok === true
      ? `${result.age.years} years, ${result.age.months} months, ${result.age.days} days`
      : '';

  function reset() {
    setBirthDate(null);
    setOnDate(today);
  }

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="Age result">
          {result === null ? (
            <ResultPlaceholder message="Enter a date of birth to calculate an age." />
          ) : result.ok ? (
            <div className="space-y-4">
              <PrimaryResult
                label="Age"
                value={summary}
                sub={`Born on a ${result.bornOn}.`}
              />

              <ResultList>
                <ResultRow label="Total months" value={formatInteger(result.totalMonths)} />
                <ResultRow
                  label="Total weeks"
                  value={`${formatInteger(result.totalWeeks)} weeks, ${result.remainderDaysAfterWeeks} days`}
                />
                <ResultRow label="Total days" value={formatInteger(result.totalDays)} />
                <ResultRow label="Day of the week born" value={result.bornOn} />
                <ResultRow
                  label="Next birthday"
                  value={result.nextBirthdayLabel}
                  {...(result.usedLeapDayFallback
                    ? { hint: '29 February falls in leap years only, so 28 February is used' }
                    : {})}
                />
                <ResultRow
                  label="Days until next birthday"
                  value={
                    result.daysUntilNextBirthday === 0
                      ? 'Today'
                      : `${formatInteger(result.daysUntilNextBirthday)} (turning ${result.turningAge})`
                  }
                />
              </ResultList>

              <CopyButton value={summary} label="Copy age" />
            </div>
          ) : (
            <InlineError message={result.error} />
          )}
        </ResultPanel>
      }
    >
      <DateField
        label="Date of birth"
        value={birthDate}
        onChange={setBirthDate}
        required
        max={onDate ?? today}
        helper="Treated as a plain calendar date. Nothing you enter here is sent anywhere."
      />

      <DateField
        label="Age on this date"
        value={onDate}
        onChange={setOnDate}
        helper={`Defaults to today, ${formatLongDate(today)}. Change it to work out an age on any other date.`}
      />
    </CalculatorShell>
  );
}
