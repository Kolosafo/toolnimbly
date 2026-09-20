import type { ToolContent } from '../types';

export const salaryCalculatorContent: ToolContent = {
  slug: 'salary-calculator',
  valueProposition:
    'Convert annual salary to hourly, monthly, weekly, biweekly or daily gross pay. You can also convert an hourly wage back to annual salary using your actual working hours and paid weeks.',
  intro:
    'Job listings quote pay in whatever unit suits them: an hourly rate, a monthly figure, an annual salary. This tool converts between all of them so you can compare like with like. Enter any one rate and it derives the annual equivalent first, then divides that into hourly, daily, weekly, biweekly, semimonthly and monthly figures. Hours per week, workdays per week and paid weeks per year are all adjustable, because 40 and 52 do not fit everyone.',
  steps: [
    {
      title: 'Enter your pay and say what it represents',
      body: 'Type the amount and choose its frequency — hourly, daily, weekly, biweekly, semimonthly, monthly or annual.',
    },
    {
      title: 'Adjust your working pattern',
      body: 'The defaults are 40 hours a week, five workdays and 52 paid weeks a year. Change them if you work part time, have unpaid weeks, or work a compressed week.',
    },
    {
      title: 'Read across the equivalents',
      body: 'Every other pay period is shown at once. The figures are all derived from the same annual total, so they are internally consistent.',
    },
  ],
  example: {
    title: 'A 62,000 annual salary at 40 hours a week',
    body: 'Source frequency annual, 40 hours per week, 5 workdays, 52 paid weeks.',
    rows: [
      { label: 'Hourly', value: '29.81' },
      { label: 'Daily', value: '238.46' },
      { label: 'Weekly', value: '1,192.31' },
      { label: 'Biweekly (26 per year)', value: '2,384.62' },
      { label: 'Semimonthly (24 per year)', value: '2,583.33' },
      { label: 'Monthly', value: '5,166.67' },
    ],
    conclusion:
      'Notice that biweekly and semimonthly are not the same. Biweekly pays 26 times a year, semimonthly 24 — so the individual semimonthly cheque is larger even though the annual total is identical.',
  },
  method: {
    title: 'How the conversion works',
    body: 'Everything is normalised to an annual figure first, then divided out. Deriving each period from one shared annual value is what prevents rounding drift between the rows.',
    formulas: [
      'annual   = hourly × hours per week × paid weeks per year',
      'hourly   = annual ÷ (hours per week × paid weeks per year)',
      'daily    = annual ÷ (workdays per week × paid weeks per year)',
      'weekly   = annual ÷ paid weeks per year',
      'biweekly = annual ÷ 26',
      'semimonthly = annual ÷ 24',
      'monthly  = annual ÷ 12',
    ],
    notes: [
      'The starting assumptions of 40 hours per week and 52 paid weeks per year are editable defaults, not universal rules.',
      'Biweekly means every two weeks, which is 26 pay periods in a year. Semimonthly means twice a month, which is 24.',
      'Weekly and daily figures use your paid-weeks-per-year setting; biweekly, semimonthly and monthly use the fixed calendar divisors above.',
      'Reducing paid weeks per year — for unpaid leave, say — lowers the annual figure while leaving the weekly rate unchanged.',
    ],
    sourceNote:
      'This is a country-neutral arithmetic conversion. It uses your entered hours and paid weeks and does not apply tax, overtime law or payroll rules.',
  },
  limitations: [
    'Every figure is gross pay. Income tax, national insurance or payroll taxes, pension contributions and other deductions are not calculated.',
    'Overtime premiums, shift differentials, bonuses and commission are excluded.',
    'Benefits — health cover, pension matching, paid leave — often make up a large part of total compensation and are not represented here at all.',
    'Local payroll rules vary widely. Some employers pay a 13th month, some accrue differently across a partial year.',
  ],
  privacyNote:
    'Your pay figures are never transmitted. The conversion runs entirely in your browser.',
  resultDisclaimer:
    'These are gross pay equivalents, not take-home pay. Actual net pay depends on tax, deductions and local payroll rules that this tool does not calculate.',
  faqs: [
    {
      question: 'Is this my take-home pay?',
      answer:
        'No. Every figure here is gross — before income tax, payroll taxes, pension contributions and any other deduction. Net pay is typically a good deal lower and depends on rules specific to your country and circumstances.',
    },
    {
      question: 'How do I turn an hourly rate into an annual salary?',
      answer:
        'Multiply the hourly rate by your hours per week and then by your paid weeks per year. At 40 hours and 52 weeks that is 2,080 hours, so 30 an hour is 62,400 a year. Adjust the paid-weeks figure down if some of your weeks are unpaid.',
    },
    {
      question: 'Why do biweekly and semimonthly differ?',
      answer:
        'Biweekly pay arrives every fourteen days, which works out to 26 payments a year. Semimonthly pay arrives twice a month, which is 24. Same annual salary, different cheque size and different number of cheques.',
    },
    {
      question: 'What should I set paid weeks per year to?',
      answer:
        'If you are salaried with paid holiday, 52 is right — your leave is already paid. If you are hourly or contract and take unpaid weeks off, subtract them: someone taking four unpaid weeks should enter 48.',
    },
    {
      question: 'Does this handle part-time hours?',
      answer:
        'Yes. Set hours per week to your actual hours and workdays per week to the days you work. A 22-hour, three-day week converts correctly across every period.',
    },
  ],
};
