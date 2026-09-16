'use client';

import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/feedback/copy-button';
import { DateField } from '@/components/forms/date-field';
import { SwitchField } from '@/components/forms/switch-field';
import {
  CalculatorShell,
  PrimaryResult,
  ResultList,
  ResultPanel,
  ResultPlaceholder,
  ResultRow,
} from '@/components/tool-shell/calculator-shell';
import { calculateDateDifference } from '@/lib/calculators/date-difference';
import { formatLongDate, todayLocal, type CalendarDate } from '@/lib/date/calendar';
import { formatInteger } from '@/lib/formatting/number';

export function DateDifferenceCalculator() {
  const [today] = useState<CalendarDate>(() => todayLocal());
  const [start, setStart] = useState<CalendarDate | null>(today);
  const [end, setEnd] = useState<CalendarDate | null>(null);
  const [includeEndDate, setIncludeEndDate] = useState(false);
  const [excludeWeekends, setExcludeWeekends] = useState(false);

  const result = useMemo(() => {
    if (!start || !end) return null;
    return calculateDateDifference(start, end, { includeEndDate, excludeWeekends });
  }, [start, end, includeEndDate, excludeWeekends]);

  const summary =
    result?.ok === true
      ? `${formatInteger(result.totalDays)} ${result.totalDays === 1 ? 'day' : 'days'}`
      : '';

  function reset() {
    setStart(today);
    setEnd(null);
    setIncludeEndDate(false);
    setExcludeWeekends(false);
  }

  return (
    <CalculatorShell
      onReset={reset}
      results={
        <ResultPanel title="Date difference result">
          {result === null || !result.ok ? (
            <ResultPlaceholder message="Choose both dates to see the difference." />
          ) : (
            <div className="space-y-4">
              <PrimaryResult
                label={includeEndDate ? 'Total days, end date included' : 'Total days'}
                value={summary}
                sub={
                  result.sameDate
                    ? 'Both dates are the same day.'
                    : `${formatLongDate(result.earlier)} is earlier than ${formatLongDate(result.later)}.`
                }
              />

              <ResultList>
                <ResultRow
                  label="Calendar difference"
                  value={`${result.duration.years}y ${result.duration.months}m ${result.duration.days}d`}
                  hint="Months vary in length, so the total-days figure is the exact one"
                />
                <ResultRow
                  label="Weeks and days"
                  value={`${formatInteger(result.weeks)} weeks, ${result.remainderDays} days`}
                />
                {result.businessDays !== null ? (
                  <ResultRow
                    label="Business days"
                    value={formatInteger(result.businessDays)}
                    emphasis
                    hint="Monday to Friday. Public holidays are not excluded"
                  />
                ) : null}
                <ResultRow label="Earlier date falls on" value={result.startWeekday} />
                <ResultRow label="Later date falls on" value={result.endWeekday} />
              </ResultList>

              {result.reversed ? (
                <p className="rounded-md border border-info-border bg-info-surface px-3 py-2 text-sm">
                  You entered the later date first. The result shows the size of the gap either way.
                </p>
              ) : null}

              <CopyButton value={summary} label="Copy total" />
            </div>
          )}
        </ResultPanel>
      }
    >
      <DateField label="Start date" value={start} onChange={setStart} required />
      <DateField label="End date" value={end} onChange={setEnd} required />

      <div className="space-y-3 border-t border-border-default pt-4">
        <SwitchField
          label="Include the end date"
          checked={includeEndDate}
          onChange={setIncludeEndDate}
          helper="Turn on when both days are part of the span, such as a leave request or a notice period."
        />
        <SwitchField
          label="Count business days only"
          checked={excludeWeekends}
          onChange={setExcludeWeekends}
          helper="Counts Monday to Friday. Public holidays are not applied."
        />
      </div>
    </CalculatorShell>
  );
}
