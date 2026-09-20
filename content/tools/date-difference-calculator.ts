import type { ToolContent } from '../types';

export const dateDifferenceCalculatorContent: ToolContent = {
  slug: 'date-difference-calculator',
  valueProposition:
    'Days, weeks and business days between two dates — with the inclusive-counting question answered explicitly.',
  intro:
    'How many days are there between two dates? The honest answer is that it depends on whether you count both ends, and most tools never say which they did. This one has a switch for it. Enter two dates in either order and it reports the calendar difference in years, months and days, the total in days and in weeks-plus-days, and — when you ask for it — the number of weekdays, excluding Saturdays and Sundays.',
  steps: [
    {
      title: 'Enter the two dates',
      body: 'Order does not matter. The tool works out which is earlier and tells you the direction of the difference.',
    },
    {
      title: 'Decide whether the end date counts',
      body: 'Turn on "include end date" when both endpoints are part of the span — a hotel stay, a notice period, a contract that runs through its final day.',
    },
    {
      title: 'Switch on business days if you need them',
      body: 'Excluding weekends counts Monday to Friday only within the selected span. Public holidays are not applied.',
    },
    {
      title: 'Read the breakdown',
      body: 'Calendar difference, total days, weeks plus remaining days and the business-day count are all shown together.',
    },
  ],
  example: {
    title: 'A project running from 3 March 2026 to 17 April 2026',
    body: 'A typical planning question, with and without the end date counted.',
    rows: [
      { label: 'Excluding the end date', value: '45 days' },
      { label: 'Including the end date', value: '46 days' },
      { label: 'Calendar difference', value: '1 month, 14 days' },
      { label: 'Weeks and days', value: '6 weeks, 3 days' },
      { label: 'Weekdays, end date included', value: '34 business days' },
    ],
    conclusion:
      'The one-day gap between the first two rows is the whole reason this switch exists. Deadlines and billing periods usually include the final day; elapsed-time questions usually do not.',
  },
  method: {
    title: 'How the difference is measured',
    body: 'Both dates are treated as plain calendar dates. The total is a difference of day numbers, and the years-months-days breakdown borrows down exactly as manual arithmetic would.',
    formulas: [
      'total days     = day number of later date − day number of earlier date',
      'inclusive days = total days + 1',
      'weeks and days = total days ÷ 7, with the remainder as days',
      'business days  = count of Monday–Friday dates in the selected span',
    ],
    notes: [
      'Because the count uses calendar day numbers rather than elapsed milliseconds, a daylight-saving change never adds or drops a day.',
      'The calendar breakdown is direction-aware: the sign tells you which date came first, and the wording says so in plain language too.',
      'Business-day counting respects the include-end-date switch, so a Friday-to-Friday span can be four or five weekdays depending on it.',
    ],
  },
  limitations: [
    'A weekend means Saturday and Sunday. Working weeks that run differently are not supported in this version.',
    'Public holidays are not excluded. A business-day count across a holiday period will be higher than the working days actually available.',
    'Time of day is ignored entirely. These are whole-date calculations.',
    'Months vary in length, so a "1 month, 14 days" breakdown is not a fixed number of days — the total-days figure is the unambiguous one.',
  ],
  privacyNote:
    'Both dates stay in your browser. Nothing is uploaded and nothing is retained after you leave the page.',
  faqs: [
    {
      question: 'Should I include the end date or not?',
      answer:
        'Include it when both days are part of the thing you are measuring — a leave request covering Monday through Friday is five days, not four. Exclude it when you are measuring elapsed time between two moments, such as how long ago something happened.',
    },
    {
      question: 'How are business days counted?',
      answer:
        'Every date in the span is examined and only Mondays through Fridays are counted. There is no assumption about holidays, so check your own calendar for public holidays in the period.',
    },
    {
      question: 'Why does the months-and-days breakdown look odd?',
      answer:
        'Because calendar months are between 28 and 31 days long. Counting "one month" from 31 January lands on 28 February, so the remaining days are measured against a different month length than you might expect. The total-days figure is always exact.',
    },
    {
      question: 'Can I enter the later date first?',
      answer:
        'Yes. The tool sorts them and reports the magnitude of the difference along with which date is earlier, so you never get a confusing negative number without explanation.',
    },
    {
      question: 'Does this work across daylight-saving changes?',
      answer:
        'Yes. The calculation compares calendar dates, not timestamps, so the spring and autumn clock changes have no effect on the day count.',
    },
    {
      question: 'Does the count include leap days?',
      answer:
        'Yes. The total is a real calendar count, so a span crossing 29 February includes that day. This is why two intervals that look like the same number of years can differ by a day, and why the years-months-days breakdown is the more reliable figure when you are comparing anniversaries rather than elapsed time.',
    },
  ],
};
