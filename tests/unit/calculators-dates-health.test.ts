import { describe, expect, it } from 'vitest';

import { calculateAge } from '@/lib/calculators/age';
import { calculateDateDifference } from '@/lib/calculators/date-difference';
import {
  ACTIVITY_LEVELS,
  calculateBmi,
  calculateBmr,
  calculateCalories,
  categoriseBmi,
  feetInchesToCentimetres,
  kilogramsToPounds,
  MINIMUM_SAFE_CALORIES,
  poundsToKilograms,
} from '@/lib/calculators/health';

const round = (value: number, decimals = 2) => Number(value.toFixed(decimals));

describe('age calculator', () => {
  it('matches the worked example published on the page', () => {
    const birth = { year: 2004, month: 2, day: 29 };

    const onMarch1 = calculateAge(birth, { year: 2026, month: 3, day: 1 });
    expect(onMarch1.ok).toBe(true);
    if (!onMarch1.ok) return;
    expect(onMarch1.age).toEqual({ years: 22, months: 0, days: 1 });
    expect(onMarch1.bornOn).toBe('Sunday');

    const onFeb28 = calculateAge(birth, { year: 2026, month: 2, day: 28 });
    expect(onFeb28.ok).toBe(true);
    if (!onFeb28.ok) return;
    expect(onFeb28.age).toEqual({ years: 22, months: 0, days: 0 });
  });

  it('observes a leap-day birthday on 28 February and says so', () => {
    const result = calculateAge(
      { year: 2004, month: 2, day: 29 },
      { year: 2026, month: 6, day: 1 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextBirthday).toEqual({ year: 2027, month: 2, day: 28 });
    expect(result.usedLeapDayFallback).toBe(true);
    expect(result.nextBirthdayLabel).toBe('28 February 2027');
  });

  it('uses the real date in a leap year', () => {
    const result = calculateAge(
      { year: 2004, month: 2, day: 29 },
      { year: 2027, month: 6, day: 1 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextBirthday).toEqual({ year: 2028, month: 2, day: 29 });
    expect(result.usedLeapDayFallback).toBe(false);
  });

  it('rejects a birth date after the target date', () => {
    const result = calculateAge(
      { year: 2026, month: 5, day: 1 },
      { year: 2026, month: 4, day: 30 },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/after the date/i);
  });

  it('reports zero age on the day of birth', () => {
    const date = { year: 2026, month: 9, day: 16 };
    const result = calculateAge(date, date);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.age).toEqual({ years: 0, months: 0, days: 0 });
    expect(result.totalDays).toBe(0);
    expect(result.daysUntilNextBirthday).toBe(0);
  });

  it('derives total weeks and the remainder consistently', () => {
    const result = calculateAge(
      { year: 2000, month: 1, day: 1 },
      { year: 2026, month: 9, day: 16 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalWeeks * 7 + result.remainderDaysAfterWeeks).toBe(result.totalDays);
    expect(result.totalMonths).toBe(result.age.years * 12 + result.age.months);
  });

  it('counts down to the next birthday correctly across a year boundary', () => {
    const result = calculateAge(
      { year: 1990, month: 1, day: 5 },
      { year: 2026, month: 12, day: 30 },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextBirthday).toEqual({ year: 2027, month: 1, day: 5 });
    expect(result.daysUntilNextBirthday).toBe(6);
    expect(result.turningAge).toBe(37);
  });

  it('is unaffected by daylight-saving transitions', () => {
    // 8 March 2026 is a spring-forward date in the test timezone.
    const result = calculateAge(
      { year: 2026, month: 3, day: 7 },
      { year: 2026, month: 3, day: 9 },
    );
    expect(result.ok && result.totalDays).toBe(2);
  });
});

describe('date difference calculator', () => {
  const options = { includeEndDate: false, excludeWeekends: false };

  it('matches the worked example published on the page', () => {
    const start = { year: 2026, month: 3, day: 3 };
    const end = { year: 2026, month: 4, day: 17 };

    const exclusive = calculateDateDifference(start, end, options);
    expect(exclusive.ok && exclusive.totalDays).toBe(45);

    const inclusive = calculateDateDifference(start, end, { ...options, includeEndDate: true });
    expect(inclusive.ok && inclusive.totalDays).toBe(46);

    expect(exclusive.ok && exclusive.duration).toEqual({ years: 0, months: 1, days: 14 });
    expect(exclusive.ok && exclusive.weeks).toBe(6);
    expect(exclusive.ok && exclusive.remainderDays).toBe(3);

    const business = calculateDateDifference(start, end, {
      includeEndDate: true,
      excludeWeekends: true,
    });
    expect(business.ok && business.businessDays).toBe(34);
  });

  it('works with the dates given in either order', () => {
    const a = { year: 2026, month: 1, day: 1 };
    const b = { year: 2026, month: 3, day: 1 };

    const forward = calculateDateDifference(a, b, options);
    const backward = calculateDateDifference(b, a, options);

    expect(forward.ok && forward.totalDays).toBe(backward.ok && backward.totalDays);
    expect(forward.ok && forward.reversed).toBe(false);
    expect(backward.ok && backward.reversed).toBe(true);
    expect(backward.ok && backward.earlier).toEqual(a);
    expect(backward.ok && backward.later).toEqual(b);
  });

  it('reports the same date as a zero-day span, or one day when inclusive', () => {
    const date = { year: 2026, month: 9, day: 16 };
    const exclusive = calculateDateDifference(date, date, options);
    expect(exclusive.ok && exclusive.totalDays).toBe(0);
    expect(exclusive.ok && exclusive.sameDate).toBe(true);

    const inclusive = calculateDateDifference(date, date, { ...options, includeEndDate: true });
    expect(inclusive.ok && inclusive.totalDays).toBe(1);
  });

  it('counts a Monday-to-Friday week as five business days when inclusive', () => {
    const monday = { year: 2026, month: 9, day: 14 };
    const friday = { year: 2026, month: 9, day: 18 };
    const result = calculateDateDifference(monday, friday, {
      includeEndDate: true,
      excludeWeekends: true,
    });
    expect(result.ok && result.businessDays).toBe(5);
    expect(result.ok && result.startWeekday).toBe('Monday');
    expect(result.ok && result.endWeekday).toBe('Friday');
  });

  it('omits the business-day figure unless it was requested', () => {
    const result = calculateDateDifference(
      { year: 2026, month: 1, day: 1 },
      { year: 2026, month: 2, day: 1 },
      options,
    );
    expect(result.ok && result.businessDays).toBeNull();
  });

  it('keeps weeks and the remainder consistent with the total', () => {
    const result = calculateDateDifference(
      { year: 2024, month: 2, day: 28 },
      { year: 2026, month: 11, day: 3 },
      { includeEndDate: true, excludeWeekends: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.weeks * 7 + result.remainderDays).toBe(result.totalDays);
    expect(result.businessDays).toBeLessThanOrEqual(result.totalDays);
  });

  it('spans a leap day correctly', () => {
    const result = calculateDateDifference(
      { year: 2024, month: 2, day: 28 },
      { year: 2024, month: 3, day: 1 },
      options,
    );
    // 28 Feb → 29 Feb → 1 Mar is two days in a leap year.
    expect(result.ok && result.totalDays).toBe(2);
  });
});

describe('unit conversions', () => {
  it('converts pounds and kilograms reversibly', () => {
    expect(round(poundsToKilograms(154.324), 1)).toBe(70);
    expect(round(kilogramsToPounds(70), 1)).toBe(154.3);
    expect(round(kilogramsToPounds(poundsToKilograms(180)), 6)).toBe(180);
  });

  it('converts feet and inches to centimetres', () => {
    expect(round(feetInchesToCentimetres(5, 9), 1)).toBe(175.3);
    expect(round(feetInchesToCentimetres(6, 0), 1)).toBe(182.9);
  });
});

describe('BMI calculator', () => {
  it('matches the spec reference: 70 kg at 1.75 m is about 22.9', () => {
    const result = calculateBmi({ weightKg: 70, heightCm: 175 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(round(result.bmi, 1)).toBe(22.9);
    expect(result.category).toBe('healthy');
    expect(result.categoryLabel).toBe('Healthy weight');
  });

  it('matches the healthy weight range published on the page', () => {
    const result = calculateBmi({ weightKg: 70, heightCm: 175 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(round(result.healthyWeightRangeKg?.min ?? 0, 1)).toBe(56.7);
    expect(round(result.healthyWeightRangeKg?.max ?? 0, 1)).toBe(76.3);
  });

  it('agrees between metric and US customary inputs', () => {
    const metric = calculateBmi({ weightKg: 70, heightCm: 175 });
    const imperial = calculateBmi({
      weightKg: poundsToKilograms(154.324),
      heightCm: feetInchesToCentimetres(5, 8.898),
    });
    expect(metric.ok && imperial.ok).toBe(true);
    if (!metric.ok || !imperial.ok) return;
    expect(round(metric.bmi, 1)).toBe(round(imperial.bmi, 1));
  });

  it('applies the standard thresholds exactly at their boundaries', () => {
    expect(categoriseBmi(18.49)).toBe('underweight');
    expect(categoriseBmi(18.5)).toBe('healthy');
    expect(categoriseBmi(24.99)).toBe('healthy');
    expect(categoriseBmi(25)).toBe('overweight');
    expect(categoriseBmi(29.99)).toBe('overweight');
    expect(categoriseBmi(30)).toBe('obesity');
  });

  it('withholds an adult category under the age of 20 and explains why', () => {
    const teenager = calculateBmi({ weightKg: 60, heightCm: 170, age: 16 });
    expect(teenager.ok).toBe(true);
    if (!teenager.ok) return;
    expect(teenager.category).toBeNull();
    expect(teenager.categoryLabel).toBeNull();
    expect(teenager.categoryNote).toMatch(/growth charts/i);
    // The number itself is still reported.
    expect(round(teenager.bmi, 1)).toBe(20.8);
    // The healthy range is withheld too: it is derived from the adult
    // 18.5–24.9 band, so publishing it would deliver the adult classification
    // by another route.
    expect(teenager.healthyWeightRangeKg).toBeNull();
    expect(teenager.healthyWeightRangeLb).toBeNull();
  });

  it('applies adult categories from exactly age 20', () => {
    expect(calculateBmi({ weightKg: 60, heightCm: 170, age: 19 }).ok).toBe(true);
    const at19 = calculateBmi({ weightKg: 60, heightCm: 170, age: 19 });
    const at20 = calculateBmi({ weightKg: 60, heightCm: 170, age: 20 });
    expect(at19.ok && at19.category).toBeNull();
    expect(at20.ok && at20.category).toBe('healthy');
    expect(at19.ok && at19.healthyWeightRangeKg).toBeNull();
    expect(at20.ok && at20.healthyWeightRangeKg).not.toBeNull();
  });

  it('rejects out-of-range and non-finite input', () => {
    expect(calculateBmi({ weightKg: 0, heightCm: 175 }).ok).toBe(false);
    expect(calculateBmi({ weightKg: 70, heightCm: 0 }).ok).toBe(false);
    expect(calculateBmi({ weightKg: 70, heightCm: 20 }).ok).toBe(false);
    expect(calculateBmi({ weightKg: 1000, heightCm: 175 }).ok).toBe(false);
    expect(calculateBmi({ weightKg: Number.NaN, heightCm: 175 }).ok).toBe(false);
  });
});

describe('calorie calculator', () => {
  it('matches the spec formula for both variants', () => {
    // male: 10W + 6.25H − 5A + 5
    expect(calculateBmr({ weightKg: 82, heightCm: 180, age: 35, sex: 'male' })).toBe(1775);
    // female: 10W + 6.25H − 5A − 161
    expect(calculateBmr({ weightKg: 62, heightCm: 165, age: 30, sex: 'female' })).toBe(
      10 * 62 + 6.25 * 165 - 5 * 30 - 161,
    );
  });

  it('matches the worked example published on the page', () => {
    const result = calculateCalories({
      weightKg: 82,
      heightCm: 180,
      age: 35,
      sex: 'male',
      activity: 'moderate',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.bmr).toBe(1775);
    expect(Math.round(result.tdee)).toBe(2751);
    expect(Math.round(result.targets.find((t) => t.key === 'mildLoss')?.calories ?? 0)).toBe(2501);
    expect(Math.round(result.targets.find((t) => t.key === 'loss')?.calories ?? 0)).toBe(2251);
  });

  it('matches the activity-level claim in the worked example', () => {
    const base = { weightKg: 82, heightCm: 180, age: 35, sex: 'male' as const };
    const moderate = calculateCalories({ ...base, activity: 'moderate' });
    const light = calculateCalories({ ...base, activity: 'light' });
    expect(moderate.ok && light.ok).toBe(true);
    if (!moderate.ok || !light.ok) return;

    expect(Math.round(light.tdee)).toBe(2441);
    // The page quotes the swing between the two *displayed* figures, which is
    // what a user actually compares. Rounding the raw difference instead gives
    // 311, because 2751.25 − 2440.625 = 310.625.
    expect(Math.round(moderate.tdee) - Math.round(light.tdee)).toBe(310);
  });

  it('applies every documented activity multiplier', () => {
    const base = { weightKg: 70, heightCm: 170, age: 30, sex: 'female' as const };
    const bmr = calculateBmr(base);
    for (const [key, { multiplier }] of Object.entries(ACTIVITY_LEVELS)) {
      const result = calculateCalories({ ...base, activity: key as keyof typeof ACTIVITY_LEVELS });
      expect(result.ok, key).toBe(true);
      if (result.ok) expect(round(result.tdee), key).toBe(round(bmr * multiplier));
    }
  });

  it('restricts the tool to adults aged 18 to 100', () => {
    const base = { weightKg: 70, heightCm: 170, sex: 'male' as const, activity: 'sedentary' as const };
    expect(calculateCalories({ ...base, age: 17 }).ok).toBe(false);
    expect(calculateCalories({ ...base, age: 18 }).ok).toBe(true);
    expect(calculateCalories({ ...base, age: 100 }).ok).toBe(true);
    expect(calculateCalories({ ...base, age: 101 }).ok).toBe(false);
  });

  it('warns when a presented target falls below the documented safe floor', () => {
    // A small, sedentary person has a low TDEE, so the −500 target drops under
    // the 1,200 kcal floor for the female equation.
    const result = calculateCalories({
      weightKg: 45,
      heightCm: 150,
      age: 30,
      sex: 'female',
      activity: 'sedentary',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const lossTarget = result.targets.find((target) => target.key === 'loss');
    expect(lossTarget?.calories).toBeLessThan(MINIMUM_SAFE_CALORIES.female);
    expect(lossTarget?.belowSafeFloor).toBe(true);
    expect(result.safetyWarning).toMatch(/qualified health professional/i);
  });

  it('does not warn when every target is above the floor', () => {
    const result = calculateCalories({
      weightKg: 82,
      heightCm: 180,
      age: 35,
      sex: 'male',
      activity: 'moderate',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.safetyWarning).toBeNull();
    expect(result.targets.every((target) => !target.belowSafeFloor)).toBe(true);
  });

  it('rejects implausible body measurements', () => {
    const base = { age: 30, sex: 'male' as const, activity: 'sedentary' as const };
    expect(calculateCalories({ ...base, weightKg: 10, heightCm: 170 }).ok).toBe(false);
    expect(calculateCalories({ ...base, weightKg: 70, heightCm: 100 }).ok).toBe(false);
    expect(calculateCalories({ ...base, weightKg: 70, heightCm: 300 }).ok).toBe(false);
  });
});
