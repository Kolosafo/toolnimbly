import type { ToolContent } from '../types';

export const ageCalculatorContent: ToolContent = {
  slug: 'age-calculator',
  valueProposition:
    'Exact age in years, months and days — using calendar arithmetic, not a division by 86,400,000.',
  intro:
    'Enter a date of birth and this calculator gives the completed age in years, months and days, along with the totals in months, weeks and days, the weekday you were born on and how long until the next birthday. It works from calendar dates rather than timestamps, which is why the day counts stay correct across daylight-saving changes and leap years. You can calculate an age on any date, not just today.',
  steps: [
    {
      title: 'Enter the date of birth',
      body: 'Use the date field or type the date directly. The date is treated as a plain calendar date, so no timezone shifts it by a day.',
    },
    {
      title: 'Choose the date to measure to',
      body: 'This defaults to today in your local calendar. Change it to work out an age on a past or future date — useful for eligibility cut-offs.',
    },
    {
      title: 'Read the breakdown',
      body: 'Completed years, months and days appear first, then total months, weeks and days, the birth weekday and the countdown to the next birthday.',
    },
  ],
  example: {
    title: 'Someone born on 29 February 2004, measured on 1 March 2026',
    body: 'A leap-day birthday is the case that breaks naive age code, so it is worth walking through.',
    rows: [
      { label: 'Date of birth', value: '29 February 2004 (a Sunday)' },
      { label: 'Age on 1 March 2026', value: '22 years, 0 months, 1 day' },
      { label: 'Age on 28 February 2026', value: '22 years, 0 months, 0 days' },
      { label: 'Next birthday', value: '28 February 2027, because 2027 is not a leap year' },
    ],
    conclusion:
      'This tool treats 28 February as the birthday in non-leap years, which matches the most common legal and administrative convention. It says so on screen rather than deciding silently.',
  },
  method: {
    title: 'How calendar age is computed',
    body: 'Years, months and days are borrowed down in that order, exactly the way you would do it on paper. Totals are counted in whole calendar days, never by subtracting timestamps.',
    formulas: [
      'years  = target year − birth year',
      'months = target month − birth month',
      'days   = target day − birth day',
      'if days < 0:   borrow the number of days in the month before the target month',
      'if months < 0: borrow 12 months from the year count',
    ],
    notes: [
      'Total days is counted as a difference of calendar day numbers, so a clock change never adds or removes a day.',
      'A birth date after the target date is rejected rather than reported as a negative age.',
      'The weekday is derived from the calendar date itself, independent of your device timezone.',
    ],
  },
  limitations: [
    'Ages are calculated from calendar dates only. Time of day and birth timezone are not considered.',
    'For a 29 February birthday in a non-leap year, this tool uses 28 February. Some jurisdictions use 1 March for specific legal purposes.',
    'Historical dates before the Gregorian calendar was adopted locally will not match contemporary records, because adoption happened in different years in different countries.',
    'This is a calendar tool, not a legal determination of age for any specific purpose.',
  ],
  privacyNote:
    'A date of birth is personal data, so it never leaves this page. It is not transmitted, not stored, and never included in any analytics event.',
  faqs: [
    {
      question: 'How is age in years, months and days worked out?',
      answer:
        'The same way you would by hand: subtract the years, then the months, then the days, borrowing from the next unit up when a subtraction goes negative. That is why the result is completed age — you turn a year older on your birthday, not gradually through the year.',
    },
    {
      question: 'What happens to a 29 February birthday?',
      answer:
        'In leap years the birthday is 29 February. In other years this tool uses 28 February, which is the convention most administrative systems follow. The next-birthday line tells you which date it picked so there is no ambiguity.',
    },
    {
      question: 'Why does my total day count differ from another calculator?',
      answer:
        'Usually because the other tool subtracted two timestamps and divided by the number of milliseconds in a day. Across a daylight-saving boundary one of those days is 23 or 25 hours long, which can shift the total by one. This tool counts calendar days instead.',
    },
    {
      question: 'Can I calculate an age at a date in the past?',
      answer:
        'Yes. Change the "age on" date to any date after the birth date. This is the quickest way to check something like whether someone was 18 on a particular cut-off day.',
    },
    {
      question: 'Is the day of the week I was born accurate for old dates?',
      answer:
        'Yes, for any date in the Gregorian calendar. Be aware that countries adopted that calendar at different times, so very old records from some regions were written using the Julian calendar and will not match.',
    },
  ],
};
