/**
 * Date difference (spec §6.7).
 *
 * The inclusive/exclusive question is answered explicitly rather than left
 * implied, because it is the single most common source of off-by-one errors in
 * date tools.
 */

import {
  calendarDifference,
  compareCalendarDates,
  countWeekdays,
  differenceInCalendarDays,
  weekdayName,
  type CalendarDate,
  type CalendarDuration,
  type WeekdayName,
} from '@/lib/date/calendar';

export type DateDifferenceOptions = {
  /** Counts the end date itself as part of the span. */
  includeEndDate: boolean;
  /** Also report a Monday–Friday count. */
  excludeWeekends: boolean;
};

export type DateDifferenceResult =
  | {
      ok: true;
      /** Always the earlier of the two dates. */
      earlier: CalendarDate;
      later: CalendarDate;
      /** True when the user entered the later date first. */
      reversed: boolean;
      sameDate: boolean;
      duration: CalendarDuration;
      totalDays: number;
      weeks: number;
      remainderDays: number;
      businessDays: number | null;
      startWeekday: WeekdayName;
      endWeekday: WeekdayName;
    }
  | { ok: false; error: string };

export function calculateDateDifference(
  start: CalendarDate,
  end: CalendarDate,
  options: DateDifferenceOptions,
): DateDifferenceResult {
  const comparison = compareCalendarDates(start, end);
  const reversed = comparison > 0;
  const earlier = reversed ? end : start;
  const later = reversed ? start : end;

  const rawDays = differenceInCalendarDays(earlier, later);
  const totalDays = options.includeEndDate ? rawDays + 1 : rawDays;

  return {
    ok: true,
    earlier,
    later,
    reversed,
    sameDate: comparison === 0,
    duration: calendarDifference(earlier, later),
    totalDays,
    weeks: Math.floor(totalDays / 7),
    remainderDays: totalDays % 7,
    businessDays: options.excludeWeekends
      ? countWeekdays(earlier, later, options.includeEndDate)
      : null,
    startWeekday: weekdayName(earlier),
    endWeekday: weekdayName(later),
  };
}
