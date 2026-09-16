/**
 * BMI and calorie estimation (spec §6.8, §6.9).
 *
 * Both are general-information screening tools. Every result carries an
 * explicit scope limitation, and nothing here is ever sent anywhere — these are
 * health inputs and are treated as such.
 */

export type UnitSystem = 'metric' | 'imperial';

export const KG_PER_POUND = 0.45359237;
export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;

export function poundsToKilograms(pounds: number): number {
  return pounds * KG_PER_POUND;
}

export function kilogramsToPounds(kilograms: number): number {
  return kilograms / KG_PER_POUND;
}

export function feetInchesToCentimetres(feet: number, inches: number): number {
  return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

// --- BMI --------------------------------------------------------------------

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obesity';

export const BMI_THRESHOLDS = {
  underweightBelow: 18.5,
  healthyBelow: 25,
  overweightBelow: 30,
} as const;

/** Adult categories apply from this age (spec §6.8). */
export const ADULT_BMI_MIN_AGE = 20;

export const BMI_CATEGORY_LABELS: Record<BmiCategory, string> = {
  underweight: 'Underweight',
  healthy: 'Healthy weight',
  overweight: 'Overweight',
  obesity: 'Obesity range',
};

export type BmiResult =
  | {
      ok: true;
      bmi: number;
      /** Null when the person is under 20 and adult categories do not apply. */
      category: BmiCategory | null;
      categoryLabel: string | null;
      /** Explains a withheld category rather than leaving a blank. */
      categoryNote: string | null;
      /**
       * Null under the age of 20, for the same reason the category is. The
       * range is derived from the adult 18.5–24.9 band, so publishing it while
       * withholding the category would deliver the adult classification by
       * another route.
       */
      healthyWeightRangeKg: { min: number; max: number } | null;
      healthyWeightRangeLb: { min: number; max: number } | null;
      weightKg: number;
      heightCm: number;
    }
  | { ok: false; error: string };

export function calculateBmi(input: {
  weightKg: number;
  heightCm: number;
  age?: number | null;
}): BmiResult {
  const { weightKg, heightCm } = input;
  const age = input.age ?? null;

  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return { ok: false, error: 'Enter a weight greater than zero.' };
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    return { ok: false, error: 'Enter a height greater than zero.' };
  }
  if (heightCm < 50 || heightCm > 275) {
    return { ok: false, error: 'Enter a height between 50 cm and 275 cm (1 ft 8 in to 9 ft).' };
  }
  if (weightKg < 2 || weightKg > 650) {
    return { ok: false, error: 'Enter a weight between 2 kg and 650 kg (4 lb to 1,433 lb).' };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  const isAdult = age === null || age >= ADULT_BMI_MIN_AGE;
  const category = isAdult ? categoriseBmi(bmi) : null;

  const minKg = BMI_THRESHOLDS.underweightBelow * heightM * heightM;
  // The healthy band tops out just below 25; 24.9 is the conventional display
  // bound and is what the healthy weight range is quoted against.
  const maxKg = 24.9 * heightM * heightM;

  return {
    ok: true,
    bmi,
    category,
    categoryLabel: category ? BMI_CATEGORY_LABELS[category] : null,
    categoryNote: isAdult
      ? null
      : 'Adult BMI categories do not apply under the age of 20. Children and teenagers are assessed against age- and sex-specific growth charts, so neither a category nor a healthy weight range is shown here.',
    healthyWeightRangeKg: isAdult ? { min: minKg, max: maxKg } : null,
    healthyWeightRangeLb: isAdult
      ? { min: kilogramsToPounds(minKg), max: kilogramsToPounds(maxKg) }
      : null,
    weightKg,
    heightCm,
  };
}

export function categoriseBmi(bmi: number): BmiCategory {
  if (bmi < BMI_THRESHOLDS.underweightBelow) return 'underweight';
  if (bmi < BMI_THRESHOLDS.healthyBelow) return 'healthy';
  if (bmi < BMI_THRESHOLDS.overweightBelow) return 'overweight';
  return 'obesity';
}

// --- Calories ---------------------------------------------------------------

export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary', multiplier: 1.2, description: 'Desk job, little exercise' },
  light: { label: 'Lightly active', multiplier: 1.375, description: 'Exercise 1–3 days a week' },
  moderate: {
    label: 'Moderately active',
    multiplier: 1.55,
    description: 'Exercise 3–5 days a week',
  },
  very: { label: 'Very active', multiplier: 1.725, description: 'Exercise 6–7 days a week' },
  extra: {
    label: 'Extra active',
    multiplier: 1.9,
    description: 'Hard physical job or twice-daily training',
  },
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;

/** The two variants of the Mifflin-St Jeor equation. */
export type EquationSex = 'male' | 'female';

/** Floors below which a target must not be presented without a warning. */
export const MINIMUM_SAFE_CALORIES: Record<EquationSex, number> = {
  female: 1200,
  male: 1500,
};

export const CALORIE_AGE_RANGE = { min: 18, max: 100 } as const;

export type CalorieTarget = {
  key: 'mildLoss' | 'loss' | 'maintain' | 'mildGain' | 'gain';
  label: string;
  calories: number;
  /** True when the target falls below the documented safe floor. */
  belowSafeFloor: boolean;
};

export type CalorieResult =
  | {
      ok: true;
      bmr: number;
      tdee: number;
      targets: CalorieTarget[];
      /** Set when any presented target is below the safe floor. */
      safetyWarning: string | null;
    }
  | { ok: false; error: string };

/** Mifflin-St Jeor resting metabolic rate. */
export function calculateBmr(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: EquationSex;
}): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  return input.sex === 'male' ? base + 5 : base - 161;
}

export function calculateCalories(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: EquationSex;
  activity: ActivityLevel;
}): CalorieResult {
  const { weightKg, heightCm, age, sex, activity } = input;

  if (!Number.isFinite(age) || age < CALORIE_AGE_RANGE.min || age > CALORIE_AGE_RANGE.max) {
    return {
      ok: false,
      error: `This calculator is for adults aged ${CALORIE_AGE_RANGE.min} to ${CALORIE_AGE_RANGE.max}. Children, teenagers and older adults need assessment that accounts for growth and for age-related changes in body composition.`,
    };
  }
  if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) {
    return { ok: false, error: 'Enter a weight between 20 kg and 400 kg (44 lb to 882 lb).' };
  }
  if (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 250) {
    return { ok: false, error: 'Enter a height between 120 cm and 250 cm (3 ft 11 in to 8 ft 2 in).' };
  }

  const bmr = calculateBmr({ weightKg, heightCm, age, sex });
  const tdee = bmr * ACTIVITY_LEVELS[activity].multiplier;
  const floor = MINIMUM_SAFE_CALORIES[sex];

  const targets: CalorieTarget[] = [
    { key: 'loss', label: 'Weight loss (−500 kcal)', calories: tdee - 500 },
    { key: 'mildLoss', label: 'Gradual loss (−250 kcal)', calories: tdee - 250 },
    { key: 'maintain', label: 'Maintain weight', calories: tdee },
    { key: 'mildGain', label: 'Gradual gain (+250 kcal)', calories: tdee + 250 },
    { key: 'gain', label: 'Weight gain (+500 kcal)', calories: tdee + 500 },
  ].map((target) => ({ ...target, belowSafeFloor: target.calories < floor })) as CalorieTarget[];

  const anyBelowFloor = targets.some((target) => target.belowSafeFloor);

  return {
    ok: true,
    bmr,
    tdee,
    targets,
    safetyWarning: anyBelowFloor
      ? `One or more of these targets falls below ${floor.toLocaleString('en-US')} kcal a day, which should not be attempted without supervision from a qualified health professional. Intakes that low make adequate protein and micronutrient intake difficult and are not appropriate as a self-directed plan.`
      : null,
  };
}
