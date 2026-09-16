import type { ToolContent } from '../types';

export const calorieCalculatorContent: ToolContent = {
  slug: 'calorie-calculator',
  valueProposition:
    'Estimated resting and daily calorie needs from the Mifflin-St Jeor equation, with the assumptions spelled out.',
  intro:
    'This calculator estimates how many calories a body uses at rest and across a typical day. It uses the Mifflin-St Jeor equation, which is the resting-metabolic-rate formula most commonly recommended for healthy adults, and then applies an activity multiplier. Both the equation and the multipliers are population averages, so the result is a starting estimate rather than a measurement of your metabolism. Nothing you enter is recorded or transmitted.',
  steps: [
    {
      title: 'Choose units and enter your details',
      body: 'Metric takes kilograms and centimetres; US customary takes pounds, feet and inches. Age is required and must be between 18 and 100.',
    },
    {
      title: 'Select the sex used by the equation',
      body: 'Mifflin-St Jeor has two variants with different constants. This selects which one is applied — it is an input to the formula, nothing more.',
    },
    {
      title: 'Pick an activity level',
      body: 'Be honest, and if in doubt pick lower. Most people overestimate here, and the multiplier has a bigger effect on the result than any other input.',
    },
    {
      title: 'Read the estimate and its targets',
      body: 'You get a resting rate, a maintenance estimate, and illustrative targets for gradual loss or gain. The safety notes beside them are not decoration.',
    },
  ],
  example: {
    title: 'A 35-year-old man, 82 kg, 180 cm, moderately active',
    body: 'Metric units, moderately active means a 1.55 multiplier.',
    rows: [
      { label: 'BMR (resting)', value: '1,775 kcal/day' },
      { label: 'Maintenance (TDEE)', value: '2,751 kcal/day' },
      { label: 'Gradual loss (−250)', value: '2,501 kcal/day' },
      { label: 'Faster loss (−500)', value: '2,251 kcal/day' },
    ],
    conclusion:
      'Moving the same person from moderately active to lightly active drops maintenance to about 2,441 — a 310 kcal swing from one dropdown. That is why the activity level deserves more thought than the decimal places.',
  },
  method: {
    title: 'The Mifflin-St Jeor equation',
    body: 'Resting metabolic rate is calculated from weight, height, age and sex, then multiplied by an activity factor to estimate total daily energy expenditure.',
    formulas: [
      'male:    BMR = 10W + 6.25H − 5A + 5',
      'female:  BMR = 10W + 6.25H − 5A − 161',
      'where W = kg, H = cm, A = years',
      'TDEE = BMR × activity multiplier',
      'sedentary 1.2 · lightly active 1.375 · moderately active 1.55',
      'very active 1.725 · extra active 1.9',
    ],
    notes: [
      'US customary inputs are converted to kilograms and centimetres before the equation is applied, so both unit systems give the same answer.',
      'A deficit of roughly 500 kcal a day is often quoted as about 0.45 kg (1 lb) of weight loss a week. That rule of thumb degrades over time as the body adapts.',
      'The equation was derived from healthy adults and has a meaningful error margin for any individual — commonly around 10%, and more at the extremes of body size.',
    ],
  },
  limitations: [
    'This is an estimate from a population equation. Individual metabolic rates vary by roughly 10% either side of the prediction, and sometimes more.',
    'Activity multipliers are coarse. Two people who both select "moderately active" can differ by hundreds of calories a day.',
    'The calculator is for adults aged 18 to 100. It is not valid for children, adolescents, or during pregnancy or breastfeeding.',
    'Thyroid conditions, some medications, significant muscle mass and a history of weight cycling all shift real requirements away from the prediction.',
    'Calorie targets are illustrative arithmetic, not a diet plan. They say nothing about nutrient quality, protein needs or micronutrients.',
  ],
  privacyNote:
    'Age, sex, weight and height are health data. They stay in your browser, are never transmitted, and never appear in analytics in any form.',
  resultDisclaimer:
    'General information only — not medical or dietary advice. Very low intakes can be harmful. Do not go below 1,200 kcal a day (women) or 1,500 kcal a day (men) without supervision from a qualified health professional, and speak to one first if you have any health condition, take regular medication, are pregnant or breastfeeding, or have a history of disordered eating.',
  sources: [
    {
      label:
        'Mifflin MD, St Jeor ST, et al. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr, 1990.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/',
    },
  ],
  faqs: [
    {
      question: 'Why Mifflin-St Jeor rather than Harris-Benedict?',
      answer:
        'Mifflin-St Jeor was derived from a more recent population and has generally been found more accurate for healthy adults than the older Harris-Benedict equation. Neither measures your metabolism directly; both predict it from averages.',
    },
    {
      question: 'What is the difference between BMR and TDEE?',
      answer:
        'BMR is what your body uses at complete rest just to keep running. TDEE adds everything else — moving around, digesting food, exercising. TDEE is the figure to compare your intake against; BMR is a floor, not a target.',
    },
    {
      question: 'Which activity level should I pick?',
      answer:
        'Sedentary means a desk job and little deliberate exercise. Lightly active is roughly one to three sessions a week. Moderately active is three to five. Very active is six or seven, and extra active means hard physical work or two-a-day training. If you are between two, pick the lower one.',
    },
    {
      question: 'Why is a 500 calorie deficit suggested rather than something larger?',
      answer:
        'Because larger deficits are harder to sustain, make adequate protein and micronutrient intake more difficult, and tend to cost more lean mass. The calculator deliberately offers only modest deficits and warns when a target falls below the thresholds above.',
    },
    {
      question: 'My weight is not changing at the calculated maintenance level. Why?',
      answer:
        'The prediction carries a real error margin, and both activity and food intake are hard to estimate accurately. Treat the number as a starting point: hold it steady for two or three weeks, track the trend, and adjust from what actually happens rather than from the formula.',
    },
  ],
};
