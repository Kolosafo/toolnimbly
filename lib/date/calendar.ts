/**
 * Date-only calendar arithmetic (ADR 0003).
 *
 * A `CalendarDate` is a plain year/month/day triple with no time, no timezone
 * and no `Date` object behind it. Every operation here works on those fields or
 * on a day number, so nothing can be shifted by a daylight-saving transition or
 * by parsing `YYYY-MM-DD` as UTC.
 *
 * Months are 1-indexed: January is 1.
 */

export type CalendarDate = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

export type CalendarDuration = {
  readonly years: number;
  readonly months: number;
  readonly days: number;
};

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

export function isValidCalendarDate(date: CalendarDate): boolean {
  const { year, month, day } = date;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

/**
 * Days since 1970-01-01 in the proleptic Gregorian calendar.
 *
 * This is Howard Hinnant's `days_from_civil` algorithm. It is exact for any
 * year and involves no floating-point arithmetic, which is precisely why it is
 * used here instead of `Date.UTC(...) / 86400000`.
 */
export function toDayNumber(date: CalendarDate): number {
  const { month, day } = date;
  const year = date.year - (month <= 2 ? 1 : 0);
  const era = Math.floor((year >= 0 ? year : year - 399) / 400);
  const yearOfEra = year - era * 400; // [0, 399]
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1; // [0, 365]
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/** Inverse of `toDayNumber`. */
export function fromDayNumber(dayNumber: number): CalendarDate {
  const z = dayNumber + 719468;
  const era = Math.floor((z >= 0 ? z : z - 146096) / 146097);
  const dayOfEra = z - era * 146097; // [0, 146096]
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) - Math.floor(dayOfEra / 146096)) / 365,
  );
  const year = yearOfEra + era * 400;
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const mp = Math.floor((5 * dayOfYear + 2) / 153); // [0, 11]
  const day = dayOfYear - Math.floor((153 * mp + 2) / 5) + 1; // [1, 31]
  const month = mp + (mp < 10 ? 3 : -9); // [1, 12]
  return { year: year + (month <= 2 ? 1 : 0), month, day };
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function calendarDatesEqual(a: CalendarDate, b: CalendarDate): boolean {
  return compareCalendarDates(a, b) === 0;
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromDayNumber(toDayNumber(date) + days);
}

/**
 * Adds months, clamping the day to the end of the target month.
 * 31 January plus one month is 28 (or 29) February, not 2 or 3 March.
 */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const totalMonths = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(date.day, daysInMonth(year, month));
  return { year, month, day };
}

/** 0 = Sunday. Derived from the day number, so it is timezone-independent. */
export function dayOfWeek(date: CalendarDate): number {
  const dayNumber = toDayNumber(date);
  // 1970-01-01 was a Thursday (index 4).
  return ((dayNumber % 7) + 11) % 7;
}

export function weekdayName(date: CalendarDate): WeekdayName {
  return WEEKDAY_NAMES[dayOfWeek(date)] as WeekdayName;
}

export function isWeekend(date: CalendarDate): boolean {
  const day = dayOfWeek(date);
  return day === 0 || day === 6;
}

/** Whole calendar days between two dates. Negative when `to` precedes `from`. */
export function differenceInCalendarDays(from: CalendarDate, to: CalendarDate): number {
  return toDayNumber(to) - toDayNumber(from);
}

/**
 * Difference expressed as completed years, months and days.
 *
 * The result is always a non-negative magnitude: if the arguments arrive in the
 * wrong order they are swapped internally. Direction is a separate question,
 * and callers that care about it (the date difference calculator) compare the
 * two dates themselves. Returning a duration with a negative month count would
 * be a silently wrong answer rather than a useful one.
 *
 * Rather than subtracting each field and borrowing — which leaves `days`
 * negative when the source day exceeds the length of the borrowed month, for
 * example 31 January to 1 March — this finds the largest whole number of months
 * that can be added to `from` without passing `to`, then counts the remaining
 * days from that anchor. Because `addMonths` clamps to the end of the month,
 * the anchor is always a real date and the remainder is never negative.
 */
export function calendarDifference(from: CalendarDate, to: CalendarDate): CalendarDuration {
  if (compareCalendarDates(from, to) > 0) return calendarDifference(to, from);

  let totalMonths = (to.year - from.year) * 12 + (to.month - from.month);

  // The estimate ignores the day, so it can overshoot by at most one month.
  if (compareCalendarDates(addMonths(from, totalMonths), to) > 0) {
    totalMonths -= 1;
  }

  const anchor = addMonths(from, totalMonths);
  const days = differenceInCalendarDays(anchor, to);

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days,
  };
}

/**
 * Counts Monday–Friday dates in a span.
 * `inclusive` controls whether the end date itself is counted.
 */
export function countWeekdays(from: CalendarDate, to: CalendarDate, inclusive: boolean): number {
  const start = toDayNumber(from);
  const end = toDayNumber(to) - (inclusive ? 0 : 1);
  if (end < start) return 0;

  // Count whole weeks first, then walk the remainder — O(1) in the span length
  // apart from at most six iterations.
  const totalDays = end - start + 1;
  const wholeWeeks = Math.floor(totalDays / 7);
  let count = wholeWeeks * 5;

  const remainder = totalDays % 7;
  for (let offset = 0; offset < remainder; offset += 1) {
    const day = ((start + wholeWeeks * 7 + offset) % 7 + 11) % 7;
    if (day !== 0 && day !== 6) count += 1;
  }

  return count;
}

/** Parses `YYYY-MM-DD` without constructing a `Date`. */
export function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const date: CalendarDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  return isValidCalendarDate(date) ? date : null;
}

export function formatIsoDate(date: CalendarDate): string {
  const year = String(date.year).padStart(4, '0');
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Today in the user's *local* calendar.
 *
 * This is the one place a `Date` is read, and only its local calendar fields
 * are used — never its timestamp.
 */
export function todayLocal(now: Date = new Date()): CalendarDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Human-readable date, e.g. "29 February 2004". */
export function formatLongDate(date: CalendarDate): string {
  return `${date.day} ${MONTH_NAMES[date.month - 1]} ${date.year}`;
}

/**
 * The next occurrence of a month/day anniversary on or after `from`.
 *
 * A 29 February anniversary falls back to 28 February in non-leap years, which
 * matches the most common administrative convention. `usedFallback` reports
 * when that happened so the interface can disclose it rather than deciding
 * silently (spec §6.6).
 */
export function nextAnniversary(
  origin: CalendarDate,
  from: CalendarDate,
): { date: CalendarDate; usedFallback: boolean } {
  const build = (year: number): { date: CalendarDate; usedFallback: boolean } => {
    const isLeapDay = origin.month === 2 && origin.day === 29;
    if (isLeapDay && !isLeapYear(year)) {
      return { date: { year, month: 2, day: 28 }, usedFallback: true };
    }
    return { date: { year, month: origin.month, day: origin.day }, usedFallback: false };
  };

  const thisYear = build(from.year);
  if (compareCalendarDates(thisYear.date, from) >= 0) return thisYear;
  return build(from.year + 1);
}
