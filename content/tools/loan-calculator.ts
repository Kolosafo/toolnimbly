import type { ToolContent } from '../types';

export const loanCalculatorContent: ToolContent = {
  slug: 'loan-calculator',
  valueProposition:
    'See the payment, the total interest, and exactly how much sooner an extra payment clears the balance.',
  intro:
    'Enter a loan amount, an interest rate and a term, and this calculator returns the scheduled payment along with the part of it that is interest rather than principal. The full amortisation schedule is shown payment by payment and summarised year by year, and you can download it as CSV. Adding an optional extra monthly payment recalculates the payoff date and shows how much interest that extra money saves.',
  steps: [
    {
      title: 'Enter the amount, rate and term',
      body: 'The rate is the annual percentage rate. The term can be entered in years or months — switch the unit next to the field.',
    },
    {
      title: 'Add an extra payment if you want one',
      body: 'Any amount you add here is applied to principal every month on top of the scheduled payment. Leave it blank to see the standard schedule.',
    },
    {
      title: 'Read the summary and the schedule',
      body: 'The summary gives the payment, total interest and total paid. The table below breaks each payment into interest and principal and tracks the remaining balance.',
    },
    {
      title: 'Download the schedule',
      body: 'The CSV export contains every row of the amortisation table so you can keep it or open it in a spreadsheet.',
    },
  ],
  example: {
    title: 'A 25,000 car loan at 7.5% over five years',
    body: 'Enter 25,000 as the amount, 7.5 as the annual rate and 5 years as the term.',
    rows: [
      { label: 'Monthly payment', value: '500.95' },
      { label: 'Total interest', value: '5,056.92' },
      { label: 'Total paid', value: '30,056.92' },
      { label: 'With 100 extra per month', value: 'Paid off 11 months early, saving 1,013.61 in interest' },
    ],
    conclusion:
      'The first payment is mostly interest — about 156.25 of the 500.95 — and the balance only starts falling quickly in the final two years. The schedule makes that shift visible.',
  },
  method: {
    title: 'How the payment is calculated',
    body: 'This is the standard fixed-rate amortisation formula. The monthly rate is the annual rate divided by twelve, and the number of payments is the term in months.',
    formulas: [
      'r = annual rate ÷ 100 ÷ 12',
      'n = term in months',
      'payment = P × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)',
      'at 0% interest:  payment = P ÷ n',
    ],
    notes: [
      'Each month, interest is charged on the remaining balance first and whatever is left of the payment reduces the principal.',
      'The final payment is capped at the outstanding balance plus that month’s interest, so the schedule ends at exactly zero rather than a few cents either side.',
      'Extra payments are applied to principal immediately after the scheduled payment, which is how most lenders treat them — but confirm this with your own lender.',
    ],
  },
  limitations: [
    'Origination fees, late fees, insurance and any other lender charges are excluded. A loan with fees costs more than this calculator shows.',
    'The rate is treated as fixed for the whole term. Variable-rate and interest-only loans are not modelled.',
    'Lenders round in their own way and may use daily interest accrual. Your real payment may differ by a small amount.',
    'Extra payments are assumed to reduce principal with no prepayment penalty. Not every loan agreement works that way.',
  ],
  privacyNote:
    'Loan amounts, rates and dates stay in your browser. Nothing you type here is transmitted, stored or logged.',
  resultDisclaimer:
    'These figures are an estimate for information only, not a loan offer or financial advice. Confirm every number with your lender before making a decision.',
  faqs: [
    {
      question: 'Why is so much of my early payment going to interest?',
      answer:
        'Interest is charged on what you still owe, and at the start you owe almost the whole amount. As the balance falls, the interest portion of each payment falls with it and the principal portion grows. The schedule shows this crossover for your specific loan.',
    },
    {
      question: 'How much does an extra monthly payment actually save?',
      answer:
        'More than most people expect, because every extra pound of principal removes all the future interest that principal would have generated. Enter an amount in the extra payment field and the summary shows both the new payoff date and the interest saved.',
    },
    {
      question: 'What is APR and is it the same as the interest rate?',
      answer:
        'APR is meant to include certain fees as well as interest, so it is usually slightly higher than the headline rate. This calculator treats whatever you enter as a simple annual rate applied monthly. If you enter an APR that includes fees, the payment shown will be slightly higher than a fee-free loan at the same nominal rate.',
    },
    {
      question: 'Does this work for a mortgage?',
      answer:
        'The payment maths is identical, but a mortgage payment usually also includes property tax, insurance and sometimes HOA fees. The mortgage calculator adds those and reports loan-to-value as well.',
    },
    {
      question: 'Can I enter a 0% loan?',
      answer:
        'Yes. At 0% the payment is simply the amount divided by the number of months, and the schedule shows no interest at all. A twelve-month 0% loan of 1,200 has twelve payments of exactly 100.',
    },
  ],
};
