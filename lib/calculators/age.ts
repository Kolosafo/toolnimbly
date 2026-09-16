/**
 * Age calculation (spec §6.6). Built entirely on the date-only calendar module,
 * so nothing here can be moved by a timezone or a clock change.
 */

import {
  calendarDifference,
  compareCalendarDates,
  differenceInCalendarDays,
  formatLongDate,
  nextAnniversary,
  weekdayName,
  type CalendarDate,
  type CalendarDuration,
  type WeekdayName,
} from '@/lib/date/calendar';

export type AgeResult =
  | {
      ok: true;
      /** Completed years, months and days. */
      age: CalendarDuration;
      totalMonths: number;
      totalWeeks: number;
      totalDays: number;
      remainderDaysAfterWeeks: number;
      bornOn: WeekdayName;
      nextBirthday: CalendarDate;
      nextBirthdayLabel: string;
      daysUntilNextBirthday: number;
      /** True when a 29 February birthday was observed on 28 February. */
      usedLeapDayFallback: boolean;
      turningAge: number;
    }
  | { ok: false; error: string };

export function calculateAge(birthDate: CalendarDate, onDate: CalendarDate): AgeResult {
  if (compareCalendarDates(birthDate, onDate) > 0) {
    return {
      ok: false,
      error: 'The date of birth is after the date you are measuring to. Check both dates.',
    };
  }

  const age = calendarDifference(birthDate, onDate);
  const totalDays = differenceInCalendarDays(birthDate, onDate);
  const totalMonths = age.years * 12 + age.months;
  const { date: nextBirthday, usedFallback } = nextAnniversary(birthDate, onDate);
  const daysUntilNextBirthday = differenceInCalendarDays(onDate, nextBirthday);

  return {
    ok: true,
    age,
    totalMonths,
    totalWeeks: Math.floor(totalDays / 7),
    totalDays,
    remainderDaysAfterWeeks: totalDays % 7,
    bornOn: weekdayName(birthDate),
    nextBirthday,
    nextBirthdayLabel: formatLongDate(nextBirthday),
    daysUntilNextBirthday,
    usedLeapDayFallback: usedFallback,
    // On the birthday itself, `daysUntil` is 0 and the person has just turned
    // `age.years`; otherwise the next birthday is the following one.
    turningAge: daysUntilNextBirthday === 0 ? age.years : age.years + 1,
  };
}
