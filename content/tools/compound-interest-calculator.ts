import type { ToolContent } from '../types';

export const compoundInterestCalculatorContent: ToolContent = {
  slug: 'compound-interest-calculator',
  valueProposition:
    'Calculate how savings can grow with compound interest and regular weekly, monthly or annual contributions. Compare deposits, interest earned and the projected balance year by year.',
  intro:
    'Compound interest is interest earned on interest already earned, and over long periods it dominates the result. This calculator projects a balance from a starting amount, an annual rate and a compounding frequency, and it models recurring contributions properly — applying each one on its own schedule rather than treating a year of deposits as a single lump sum. The yearly table shows contributions and interest separately so you can see which is doing the work.',
  steps: [
    {
      title: 'Enter the starting amount and rate',
      body: 'The rate is the nominal annual rate. Choose how often it compounds: daily, monthly, quarterly, semiannually or annually.',
    },
    {
      title: 'Set the time horizon',
      body: 'Enter a duration in years or months. Longer horizons are where compounding separates itself from simple interest.',
    },
    {
      title: 'Add recurring contributions if you make them',
      body: 'Choose the amount, how often you contribute and whether each contribution lands at the beginning or the end of the period. Beginning-of-period contributions earn one extra period of interest.',
    },
    {
      title: 'Read the yearly table and export it',
      body: 'Each row shows the opening balance, contributions, interest earned and closing balance for that year. Download the whole table as CSV.',
    },
  ],
  example: {
    title: '10,000 invested at 5% with 300 added every month for ten years',
    body: 'Monthly compounding, contributions at the end of each month.',
    rows: [
      { label: 'Starting amount', value: '10,000.00' },
      { label: 'Total contributions', value: '36,000.00' },
      { label: 'Total interest earned', value: '17,054.78' },
      { label: 'Ending balance', value: '63,054.78' },
    ],
    conclusion:
      'Interest accounts for about 27% of the final balance. The same 46,000 sitting in a zero-interest account would still be 46,000.',
  },
  method: {
    title: 'How the projection is calculated',
    body: 'Rather than applying an annual formula and approximating contributions, the calculator steps through each compounding period in turn. That is what makes contribution timing and mismatched frequencies come out right.',
    formulas: [
      'periodic rate = annual rate ÷ 100 ÷ periods per year',
      'each period:  balance = balance × (1 + periodic rate)',
      'beginning-of-period contributions are added before interest is applied',
      'end-of-period contributions are added after interest is applied',
      'lump sum only:  A = P(1 + r/n)^(n × t)',
    ],
    notes: [
      'A contribution frequency that differs from the compounding frequency is handled by placing each contribution in the period it falls into, not by averaging it across the year.',
      'A 0% rate is valid and simply returns the sum of the starting amount and the contributions.',
      'Negative rates below −100% per period are rejected, because a balance cannot compound through zero.',
    ],
    sourceNote:
      'ToolNimbly performs its own calculation locally. The Investor.gov links below explain compound interest and provide a separate reference; they are not endorsements of this calculator.',
  },
  limitations: [
    'This is a projection at a constant rate, not a forecast. Real investment returns vary year to year and can be negative.',
    'Tax on interest or gains, platform fees and fund charges are all excluded. They reduce real returns, sometimes substantially.',
    'Inflation is not applied. The ending balance is in nominal terms, so its purchasing power will be lower than today’s equivalent amount.',
    'Contributions are assumed to be made in full and on time for the entire period.',
  ],
  privacyNote:
    'Balances, rates and contribution amounts are calculated in your browser and never transmitted.',
  resultDisclaimer:
    'This is an illustrative projection, not investment advice and not a guarantee of returns. Investments can fall as well as rise. Speak to a qualified financial adviser about your own situation.',
  sources: [
    {
      label: 'Investor.gov — Compound Interest Calculator',
      url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator',
    },
    {
      label: 'Investor.gov — Compound Interest definition',
      url: 'https://www.investor.gov/introduction-investing/investing-basics/glossary/compound-interest',
    },
  ],
  faqs: [
    {
      question: 'Does compounding frequency make much difference?',
      answer:
        'Less than people expect at ordinary rates. Taking 10,000 at 5% for ten years, annual compounding ends at 16,288.95 and daily compounding at 16,486.65 — a difference of 197.70, or about 1.2%. Most of that gain arrives by the time you reach monthly compounding, which lands at 16,470.09. Rate and time matter far more than frequency.',
    },
    {
      question: 'Should contributions be at the beginning or the end of the period?',
      answer:
        'Beginning-of-period means each contribution earns interest for one extra period, so the ending balance is slightly higher. If you are modelling a salary deduction that lands on payday, end-of-period is usually the closer match.',
    },
    {
      question: 'What is the rule of 72?',
      answer:
        'A quick estimate: divide 72 by the annual percentage rate to get the approximate years for money to double. At 6%, that is about twelve years. It is a mental shortcut, and this calculator gives the exact figure.',
    },
    {
      question: 'Why is the total interest so much larger in later years?',
      answer:
        'Because interest is applied to a bigger balance each period, and in this model that balance includes all previously earned interest. The yearly table makes it obvious: the interest column grows even when the contribution column does not.',
    },
    {
      question: 'Can I model a loan with this?',
      answer:
        'No — a loan is paid down rather than built up, and the payment structure is different. Use the loan calculator or the mortgage calculator for borrowing.',
    },
  ],
};
