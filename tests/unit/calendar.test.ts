import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  calendarDifference,
  compareCalendarDates,
  countWeekdays,
  dayOfWeek,
  daysInMonth,
  differenceInCalendarDays,
  formatIsoDate,
  fromDayNumber,
  isLeapYear,
  isValidCalendarDate,
  isWeekend,
  nextAnniversary,
  parseIsoDate,
  todayLocal,
  toDayNumber,
  weekdayName,
} from '@/lib/date/calendar';

/**
 * These run under TZ=America/New_York (see vitest.config.mts) so that any
 * accidental reliance on UTC parsing or on timestamp subtraction fails here
 * rather than passing by luck on a UTC build agent.
 */
describe('calendar fundamentals', () => {
  it('identifies leap years by the full Gregorian rule', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // divisible by 100, not 400
    expect(isLeapYear(2000)).toBe(true); // divisible by 400
    expect(isLeapYear(2100)).toBe(false);
  });

  it('reports month lengths including February in both cases', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(2023, 4)).toBe(30);
    expect(daysInMonth(2023, 12)).toBe(31);
  });

  it('rejects impossible dates', () => {
    expect(isValidCalendarDate({ year: 2023, month: 2, day: 29 })).toBe(false);
    expect(isValidCalendarDate({ year: 2024, month: 2, day: 29 })).toBe(true);
    expect(isValidCalendarDate({ year: 2024, month: 13, day: 1 })).toBe(false);
    expect(isValidCalendarDate({ year: 2024, month: 4, day: 31 })).toBe(false);
    expect(isValidCalendarDate({ year: 2024, month: 1, day: 0 })).toBe(false);
  });
});

describe('day numbers round-trip', () => {
  it('anchors the epoch correctly', () => {
    expect(toDayNumber({ year: 1970, month: 1, day: 1 })).toBe(0);
    expect(fromDayNumber(0)).toEqual({ year: 1970, month: 1, day: 1 });
  });

  it('round-trips every date across a multi-century span', () => {
    for (let n = -200_000; n <= 40_000; n += 97) {
      expect(toDayNumber(fromDayNumber(n))).toBe(n);
    }
  });

  it('handles dates before the epoch', () => {
    expect(fromDayNumber(toDayNumber({ year: 1900, month: 1, day: 1 }))).toEqual({
      year: 1900,
      month: 1,
      day: 1,
    });
  });
});

describe('weekdays', () => {
  it('derives the weekday independently of the process timezone', () => {
    expect(weekdayName({ year: 2004, month: 2, day: 29 })).toBe('Sunday');
    expect(weekdayName({ year: 1970, month: 1, day: 1 })).toBe('Thursday');
    expect(weekdayName({ year: 2026, month: 9, day: 16 })).toBe('Wednesday');
    expect(dayOfWeek({ year: 2026, month: 9, day: 13 })).toBe(0); // Sunday
  });

  it('identifies weekends', () => {
    expect(isWeekend({ year: 2026, month: 9, day: 12 })).toBe(true); // Saturday
    expect(isWeekend({ year: 2026, month: 9, day: 13 })).toBe(true); // Sunday
    expect(isWeekend({ year: 2026, month: 9, day: 14 })).toBe(false); // Monday
  });
});

describe('date arithmetic across DST boundaries', () => {
  // US DST in 2026: forward 8 March, back 1 November.
  it('counts a spring-forward day as exactly one day', () => {
    const before = { year: 2026, month: 3, day: 7 };
    const after = { year: 2026, month: 3, day: 9 };
    expect(differenceInCalendarDays(before, after)).toBe(2);
    expect(addDays(before, 1)).toEqual({ year: 2026, month: 3, day: 8 });
  });

  it('counts an autumn-back day as exactly one day', () => {
    const before = { year: 2026, month: 10, day: 31 };
    const after = { year: 2026, month: 11, day: 2 };
    expect(differenceInCalendarDays(before, after)).toBe(2);
  });

  it('matches a naive millisecond division only where no clock change occurs', () => {
    // Demonstrates the bug this module exists to avoid: across the spring
    // transition, local-midnight timestamps are 23 hours apart, so dividing by
    // 86,400,000 and flooring gives 0 days instead of 1.
    const naiveDays = Math.floor(
      (new Date(2026, 2, 9).getTime() - new Date(2026, 2, 8).getTime()) / 86_400_000,
    );
    expect(naiveDays).toBe(0); // wrong, and why we do not do this
    expect(
      differenceInCalendarDays({ year: 2026, month: 3, day: 8 }, { year: 2026, month: 3, day: 9 }),
    ).toBe(1); // correct
  });
});

describe('addMonths clamps to the end of the month', () => {
  it('does not overflow into the following month', () => {
    expect(addMonths({ year: 2026, month: 1, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
    expect(addMonths({ year: 2024, month: 1, day: 31 }, 1)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
    expect(addMonths({ year: 2026, month: 3, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 4,
      day: 30,
    });
  });

  it('crosses year boundaries in both directions', () => {
    expect(addMonths({ year: 2026, month: 12, day: 15 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 15,
    });
    expect(addMonths({ year: 2026, month: 1, day: 15 }, -1)).toEqual({
      year: 2025,
      month: 12,
      day: 15,
    });
    expect(addMonths({ year: 2026, month: 6, day: 15 }, 360)).toEqual({
      year: 2056,
      month: 6,
      day: 15,
    });
  });
});

describe('calendarDifference borrows correctly', () => {
  it('handles a simple whole-year difference', () => {
    expect(
      calendarDifference({ year: 1990, month: 5, day: 10 }, { year: 2026, month: 5, day: 10 }),
    ).toEqual({ years: 36, months: 0, days: 0 });
  });

  it('borrows days from the preceding month', () => {
    expect(
      calendarDifference({ year: 2026, month: 1, day: 31 }, { year: 2026, month: 3, day: 1 }),
    ).toEqual({ years: 0, months: 1, days: 1 });
  });

  it('borrows months across a year boundary', () => {
    expect(
      calendarDifference({ year: 2025, month: 11, day: 20 }, { year: 2026, month: 3, day: 5 }),
    ).toEqual({ years: 0, months: 3, days: 13 });
  });

  it('reports the day before an anniversary as one day short', () => {
    expect(
      calendarDifference({ year: 2000, month: 6, day: 15 }, { year: 2026, month: 6, day: 14 }),
    ).toEqual({ years: 25, months: 11, days: 30 });
  });

  it('never returns a negative day count when the source day is a month end', () => {
    // Regression: subtracting fields and borrowing once gives days = -2 here,
    // because February is shorter than the 31-day source month.
    for (const to of [
      { year: 2026, month: 3, day: 1 },
      { year: 2026, month: 3, day: 2 },
      { year: 2026, month: 4, day: 30 },
      { year: 2027, month: 2, day: 28 },
    ]) {
      const result = calendarDifference({ year: 2026, month: 1, day: 31 }, to);
      expect(result.days, JSON.stringify(to)).toBeGreaterThanOrEqual(0);
      expect(result.months).toBeGreaterThanOrEqual(0);
    }
  });

  it('keeps every field non-negative across a large sweep of date pairs', () => {
    const from = { year: 2024, month: 1, day: 31 };
    for (let offset = 0; offset < 900; offset += 1) {
      const to = addDays(from, offset);
      const { years, months, days } = calendarDifference(from, to);
      expect(years).toBeGreaterThanOrEqual(0);
      expect(months).toBeGreaterThanOrEqual(0);
      expect(months).toBeLessThan(12);
      expect(days).toBeGreaterThanOrEqual(0);
      // Adding the reported duration back must land on or before the target,
      // and adding one more day of months must overshoot it.
      const rebuilt = addDays(addMonths(from, years * 12 + months), days);
      expect(rebuilt).toEqual(to);
    }
  });

  it('returns the same magnitude whichever order the dates arrive in', () => {
    const earlier = { year: 2004, month: 2, day: 29 };
    const later = { year: 2026, month: 3, day: 1 };
    expect(calendarDifference(later, earlier)).toEqual(calendarDifference(earlier, later));
  });

  it('handles the documented leap-day case', () => {
    expect(
      calendarDifference({ year: 2004, month: 2, day: 29 }, { year: 2026, month: 3, day: 1 }),
    ).toEqual({ years: 22, months: 0, days: 1 });
    // 28 February is the birthday in a non-leap year (the documented fallback),
    // so this person turns 22 on that date — matching the worked example on the
    // age calculator page.
    expect(
      calendarDifference({ year: 2004, month: 2, day: 29 }, { year: 2026, month: 2, day: 28 }),
    ).toEqual({ years: 22, months: 0, days: 0 });
  });
});

describe('countWeekdays', () => {
  it('matches the worked example on the date difference page', () => {
    const start = { year: 2026, month: 3, day: 3 };
    const end = { year: 2026, month: 4, day: 17 };
    expect(differenceInCalendarDays(start, end)).toBe(45);
    expect(countWeekdays(start, end, true)).toBe(34);
    expect(countWeekdays(start, end, false)).toBe(33);
  });

  it('counts a single weekday as one and a single weekend day as zero', () => {
    const monday = { year: 2026, month: 9, day: 14 };
    const saturday = { year: 2026, month: 9, day: 12 };
    expect(countWeekdays(monday, monday, true)).toBe(1);
    expect(countWeekdays(saturday, saturday, true)).toBe(0);
  });

  it('counts exactly five weekdays in any whole week', () => {
    for (let offset = 0; offset < 7; offset += 1) {
      const start = addDays({ year: 2026, month: 9, day: 14 }, offset);
      expect(countWeekdays(start, addDays(start, 6), true)).toBe(5);
    }
  });

  it('agrees with a brute-force count over a long span', () => {
    const start = { year: 2024, month: 1, day: 1 };
    const end = { year: 2027, month: 6, day: 30 };
    let brute = 0;
    for (let n = toDayNumber(start); n <= toDayNumber(end); n += 1) {
      if (!isWeekend(fromDayNumber(n))) brute += 1;
    }
    expect(countWeekdays(start, end, true)).toBe(brute);
  });

  it('returns zero when the span is empty', () => {
    const date = { year: 2026, month: 9, day: 14 };
    expect(countWeekdays(date, date, false)).toBe(0);
  });
});

describe('ISO parsing never shifts a date', () => {
  it('parses without a timezone conversion', () => {
    expect(parseIsoDate('2026-01-01')).toEqual({ year: 2026, month: 1, day: 1 });
    expect(parseIsoDate('2004-02-29')).toEqual({ year: 2004, month: 2, day: 29 });
  });

  it('differs from the Date constructor, which is why it exists', () => {
    // `new Date('2026-01-01')` is parsed as UTC midnight, which in a western
    // timezone is 31 December locally. Our parser is unaffected.
    expect(new Date('2026-01-01').getDate()).toBe(31);
    expect(parseIsoDate('2026-01-01')?.day).toBe(1);
  });

  it('rejects malformed and impossible input', () => {
    expect(parseIsoDate('2023-02-29')).toBeNull();
    expect(parseIsoDate('not a date')).toBeNull();
    expect(parseIsoDate('2026-1-1')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('round-trips through formatting', () => {
    for (const iso of ['2026-09-16', '2004-02-29', '1970-01-01', '2100-12-31']) {
      const parsed = parseIsoDate(iso);
      expect(parsed).not.toBeNull();
      if (parsed) expect(formatIsoDate(parsed)).toBe(iso);
    }
  });
});

describe('nextAnniversary', () => {
  it('returns this year when the date is still ahead', () => {
    const result = nextAnniversary(
      { year: 1990, month: 12, day: 25 },
      { year: 2026, month: 9, day: 16 },
    );
    expect(result.date).toEqual({ year: 2026, month: 12, day: 25 });
    expect(result.usedFallback).toBe(false);
  });

  it('rolls to next year once the date has passed', () => {
    const result = nextAnniversary(
      { year: 1990, month: 3, day: 1 },
      { year: 2026, month: 9, day: 16 },
    );
    expect(result.date).toEqual({ year: 2027, month: 3, day: 1 });
  });

  it('returns today when today is the anniversary', () => {
    const result = nextAnniversary(
      { year: 1990, month: 9, day: 16 },
      { year: 2026, month: 9, day: 16 },
    );
    expect(result.date).toEqual({ year: 2026, month: 9, day: 16 });
  });

  it('falls back to 28 February for a leap-day birthday, and flags it', () => {
    const nonLeap = nextAnniversary(
      { year: 2004, month: 2, day: 29 },
      { year: 2026, month: 1, day: 1 },
    );
    expect(nonLeap.date).toEqual({ year: 2026, month: 2, day: 28 });
    expect(nonLeap.usedFallback).toBe(true);

    const leap = nextAnniversary({ year: 2004, month: 2, day: 29 }, { year: 2028, month: 1, day: 1 });
    expect(leap.date).toEqual({ year: 2028, month: 2, day: 29 });
    expect(leap.usedFallback).toBe(false);
  });
});

describe('todayLocal', () => {
  it('reads local calendar fields, not the UTC timestamp', () => {
    // 1 January 2026 at 00:30 local time in New York is already 05:30 UTC.
    // A UTC-based implementation would return 1 January either way; the risk is
    // the reverse case, so check a late-evening local time that is the next day
    // in UTC.
    const lateEvening = new Date(2026, 0, 1, 23, 30, 0);
    expect(todayLocal(lateEvening)).toEqual({ year: 2026, month: 1, day: 1 });
    expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-01-02'); // differs in UTC
  });
});

describe('comparison', () => {
  it('orders dates correctly across all three fields', () => {
    expect(
      compareCalendarDates({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 1, day: 2 }),
    ).toBeLessThan(0);
    expect(
      compareCalendarDates({ year: 2027, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 }),
    ).toBeGreaterThan(0);
    expect(
      compareCalendarDates({ year: 2026, month: 5, day: 5 }, { year: 2026, month: 5, day: 5 }),
    ).toBe(0);
  });
});
