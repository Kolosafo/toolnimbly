import type { ToolContent } from '../types';

export const bmiCalculatorContent: ToolContent = {
  slug: 'bmi-calculator',
  valueProposition:
    'Body mass index in metric or US units, with the healthy weight range for your height — and an honest account of what BMI cannot tell you.',
  intro:
    'Body mass index compares weight to height with a single number. It is a screening figure used at population level, not a diagnosis, and it says nothing about body composition. This calculator works in metric or US customary units, reports BMI to one decimal place, places adults in the standard category and shows the weight range that would put you in the healthy band for your height. Nothing you enter is recorded.',
  steps: [
    {
      title: 'Choose your units',
      body: 'Metric takes kilograms and centimetres. US customary takes pounds, with height in feet and inches.',
    },
    {
      title: 'Enter height and weight',
      body: 'Both fields show their unit beside the input. Decimals are accepted, so 5 ft 10.5 in or 71.4 kg are both fine.',
    },
    {
      title: 'Read the result and the healthy range',
      body: 'The BMI figure appears with its adult category, alongside the weight range that corresponds to a BMI of 18.5 to 24.9 at your height.',
    },
  ],
  example: {
    title: 'An adult who is 1.75 m tall and weighs 70 kg',
    body: 'Metric units, height 175 cm, weight 70 kg.',
    rows: [
      { label: 'BMI', value: '22.9' },
      { label: 'Adult category', value: 'Healthy weight (18.5 to 24.9)' },
      { label: 'Healthy range at this height', value: '56.7 kg to 76.3 kg' },
    ],
    conclusion:
      'The healthy range spans nearly 20 kg at this height. That width is a reminder that BMI is a coarse screening measure, not a target weight.',
  },
  method: {
    title: 'The formula',
    body: 'BMI divides weight by the square of height. The US customary version includes a conversion factor so pounds and inches produce the same number as kilograms and metres.',
    formulas: [
      'metric:         BMI = kg ÷ m²',
      'US customary:   BMI = 703 × lb ÷ in²',
      'healthy range:  18.5 × m²  to  24.9 × m²',
    ],
    notes: [
      'Adult categories: under 18.5 is underweight, 18.5 to 24.9 is healthy weight, 25.0 to 29.9 is overweight, and 30.0 or above falls in the obesity range.',
      'These thresholds apply to adults aged 20 and over. Below that age, BMI must be read against age- and sex-specific growth charts instead.',
      'Height in centimetres is converted to metres before squaring, so 175 cm and 1.75 m give an identical result.',
    ],
  },
  limitations: [
    'BMI does not distinguish muscle from fat. A heavily muscled athlete can register as overweight while carrying very little body fat.',
    'It says nothing about where fat is carried, and abdominal fat carries different health associations than fat elsewhere.',
    'The standard thresholds were derived largely from European-ancestry populations. Several health bodies apply lower cut-offs for people of South Asian and some East Asian ancestry.',
    'BMI is not meaningful during pregnancy, and it is a poor guide in older adults, where muscle loss can mask changes in body composition.',
    'For anyone under 20, adult categories are not applied at all. The calculator reports the BMI figure and explains why both the category and the healthy weight range are withheld — that range is derived from the adult band, so showing it would deliver the same classification by another route.',
  ],
  privacyNote:
    'Height, weight and age are sensitive health data. They stay in this page, are never transmitted, and are never included in any analytics event — not even in aggregate.',
  resultDisclaimer:
    'This is general information, not medical advice, a diagnosis or a treatment recommendation. BMI is one crude screening measure among many. Speak to a doctor or another qualified health professional about your own health.',
  sources: [
    {
      label: 'World Health Organization — Body mass index classification for adults',
      url: 'https://www.who.int/health-topics/obesity',
    },
    {
      label: 'US Centers for Disease Control and Prevention — About adult BMI',
      url: 'https://www.cdc.gov/bmi/adult-calculator/index.html',
    },
  ],
  faqs: [
    {
      question: 'Is BMI a good measure of health?',
      answer:
        'It is a useful screening measure across large populations and a blunt one for any individual. It cannot see body composition, fat distribution, fitness, blood pressure or blood markers. Treat it as one data point, and not the most informative one.',
    },
    {
      question: 'Why does the calculator refuse to categorise someone under 20?',
      answer:
        'Because children and adolescents are still growing, and a healthy BMI changes substantially with age and differs between sexes. Paediatric assessment uses percentile charts rather than fixed thresholds, so applying the adult bands would be misleading. For the same reason the healthy weight range is withheld below 20 as well, since it is calculated from those adult thresholds.',
    },
    {
      question: 'My BMI says overweight but I train regularly. What does that mean?',
      answer:
        'Muscle is denser than fat, so building muscle raises BMI without adding fat. This is a well-known limitation of the measure. Body-fat percentage, waist circumference or a professional assessment will tell you far more.',
    },
    {
      question: 'What is a healthy weight for my height?',
      answer:
        'The calculator shows the range that corresponds to a BMI of 18.5 to 24.9 at the height you entered. It is deliberately a range rather than a single number, and where within it a given person is healthiest depends on factors BMI cannot measure.',
    },
    {
      question: 'Do the thresholds differ between countries?',
      answer:
        'Yes, for some populations. Several health authorities use lower overweight and obesity cut-offs for people of South Asian and East Asian ancestry, because cardiometabolic risk rises at a lower BMI. This calculator reports the widely used international thresholds and flags that difference here.',
    },
  ],
};
