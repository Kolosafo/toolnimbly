import type { ToolContent } from '../types';

export const compoundInterestCalculatorContent: ToolContent = {
  slug: 'compound-interest-calculator',
  valueProposition:
    'Calculate how savings can grow with compound interest and regular weekly, monthly or annual contributions. Compare deposits, interest earned and the projected balance year by year.',
  intro:
    'Calculate compound interest from a starting balance, an annual nominal rate, a duration and a compounding frequency. Previously earned interest becomes part of the balance used for future calculations. You can add regular contributions and compare your starting amount, new deposits and interest in a year-by-year table. The result follows the fixed rate and timing assumptions you enter.',
  steps: [
    {
      title: 'Enter the starting amount and rate',
      body: 'The rate is the nominal annual rate. Choose how often it compounds: daily, monthly, quarterly, semiannually or annually.',
    },
    {
      title: 'Set the time horizon',
      body: 'Enter the duration in years. The calculation uses whole compounding periods, so choose a duration that fits the selected frequency for an exact period count.',
    },
    {
      title: 'Add recurring contributions if you make them',
      body: 'Choose a contribution amount and frequency. Beginning-of-period timing adds each scheduled contribution before interest in its assigned compounding period; end-of-period timing adds it afterward.',
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
    title: 'Compound interest formula and worked example',
    body: 'For a starting balance without additional deposits, use A = P(1 + r/n)^(n × t). A is the ending balance, P is the starting amount, r is the nominal annual rate as a decimal, n is the compounding periods per year and t is the number of years. For example, 1,000 at 6% compounded monthly for five years gives 1,000 × (1 + 0.06/12)^60 = 1,348.85, including 348.85 of interest. With contributions, the calculator adds deposits and interest period by period.',
    formulas: [
      'periodic rate = annual rate ÷ 100 ÷ periods per year',
      'each period:  balance = balance × (1 + periodic rate)',
      'beginning-of-period contributions are added before interest is applied',
      'end-of-period contributions are added after interest is applied',
      'lump sum only:  A = P(1 + r/n)^(n × t)',
    ],
    notes: [
      'When contribution and compounding frequencies differ, contributions are grouped into the compounding period in which they fall. This is a period-based model, not a day-by-day bank balance calculation.',
      'A 0% rate is valid and simply returns the sum of the starting amount and the contributions.',
      'Periodic rates of −100% or lower are rejected. A negative rate above that threshold can reduce the projected balance.',
    ],
    sourceNote:
      'ToolNimbly performs its own calculation locally. The Investor.gov links below explain compound interest and provide a separate reference; they are not endorsements of this calculator.',
  },
  limitations: [
    'This is a projection at a constant rate, not a forecast. Real investment returns vary year to year and can be negative.',
    'Tax on interest or gains, platform fees and fund charges are all excluded. They reduce real returns, sometimes substantially.',
    'Inflation is not applied. The ending balance is in nominal terms, so its purchasing power will be lower than today’s equivalent amount.',
    'Contributions are assumed to be made in full and on time. The tool supports additional deposits, not withdrawals. It does not offer a continuous-compounding mode or automatically solve for a target balance or doubling time.',
  ],
  privacyNote:
    'Balances, rates and contribution amounts are calculated in your browser and never transmitted.',
  resultDisclaimer:
    'This is an illustrative projection, not investment advice and not a guarantee of returns. Investments can fall as well as rise. Speak to a qualified financial adviser about your own situation.',
  sources: [
    {
      label: 'CFPB — Annual Percentage Yield Calculation',
      url: 'https://www.consumerfinance.gov/rules-policy/regulations/1030/a/',
    },
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
      question: 'Should I enter an interest rate or APY?',
      answer:
        'Enter the nominal annual interest rate, because the selected compounding frequency is applied separately. APY already includes compounding. If you only know APY, convert it to the matching nominal rate first: nominal rate = n × ((1 + APY)^(1/n) − 1), using APY as a decimal and multiplying the answer by 100 for the percentage input.',
    },
    {
      question: 'Does compounding frequency make much difference?',
      answer:
        'Less than people expect at ordinary rates. Taking 10,000 at 5% for ten years, annual compounding ends at 16,288.95 and daily compounding at 16,486.65 — a difference of 197.70, or about 1.2%. Most of that gain arrives by the time you reach monthly compounding, which lands at 16,470.09. Rate and time matter far more than frequency.',
    },
    {
      question: 'Should contributions be at the beginning or the end of the period?',
      answer:
        'In this model, beginning-of-period contributions enter before interest is calculated for their assigned compounding period; end-of-period contributions enter afterward. At a positive rate, adding the same deposit earlier increases the result. Choose the timing that best matches your scenario.',
    },
    {
      question: 'What is the rule of 72?',
      answer:
        'Divide 72 by the annual percentage rate for a rough estimate of the years needed to double a balance without extra deposits. At 6%, that is about twelve years. This tool projects a balance for the duration you enter; it does not automatically solve for the doubling time.',
    },
    {
      question: 'Why is the total interest so much larger in later years?',
      answer:
        'At a positive fixed rate, retained interest increases the balance that earns the next period of interest. Additional deposits can also increase the interest earned. The yearly table separates deposits from interest so you can see both effects.',
    },
    {
      question: 'Can I model a loan with this?',
      answer:
        'No — a loan is paid down rather than built up, and the payment structure is different. Use the loan calculator or the mortgage calculator for borrowing.',
    },
  ],
};
