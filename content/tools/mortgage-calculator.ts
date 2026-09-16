import type { ToolContent } from '../types';

export const mortgageCalculatorContent: ToolContent = {
  slug: 'mortgage-calculator',
  valueProposition:
    'The whole monthly payment — principal, interest, tax, insurance and HOA — itemised.',
  intro:
    'A mortgage payment is rarely just principal and interest. This calculator adds property tax, home insurance and HOA dues so the monthly figure resembles what actually leaves your account. It also reports the loan amount, the loan-to-value ratio, total interest over the life of the loan and a full amortisation schedule you can download. Down payment can be entered as an amount or a percentage; the two stay in step.',
  steps: [
    {
      title: 'Enter the home price and down payment',
      body: 'Type either a down payment amount or a percentage — the other field updates to match. A down payment larger than the price is refused.',
    },
    {
      title: 'Add the rate and term',
      body: 'Enter the annual interest rate and the term in years. A start date lets the schedule show real calendar months.',
    },
    {
      title: 'Fill in the recurring costs',
      body: 'Annual property tax, annual home insurance and monthly HOA dues each become part of the estimated monthly payment. Leave any of them at zero if they do not apply.',
    },
    {
      title: 'Review the breakdown and schedule',
      body: 'The itemised payment shows what each component contributes. The amortisation table and yearly summary are below it, with a CSV download.',
    },
  ],
  example: {
    title: 'A 420,000 home with 15% down at 6.25% over 30 years',
    body: 'Down payment 63,000, annual property tax 5,040, annual insurance 1,450, HOA 60 per month.',
    rows: [
      { label: 'Loan amount', value: '357,000' },
      { label: 'Loan-to-value', value: '85.0%' },
      { label: 'Principal and interest', value: '2,198.11' },
      { label: 'Tax, insurance and HOA', value: '600.83' },
      { label: 'Estimated monthly payment', value: '2,798.94' },
      { label: 'Total interest over 30 years', value: '434,320' },
    ],
    conclusion:
      'Principal and interest is only 78.5% of the monthly cost here. Budgeting from the principal-and-interest figure alone would understate the payment by about 600 a month.',
  },
  method: {
    title: 'How the estimate is built',
    body: 'Principal and interest use the same fixed-rate amortisation formula as the loan calculator. The other components are simple conversions to a monthly figure and are added on top.',
    formulas: [
      'loan amount = home price − down payment',
      'LTV = loan amount ÷ home price × 100',
      'r = annual rate ÷ 100 ÷ 12,   n = years × 12',
      'P&I = loan × r(1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)',
      'monthly total = P&I + (annual tax ÷ 12) + (annual insurance ÷ 12) + HOA',
    ],
    notes: [
      'Property tax and insurance are treated as fixed for the whole term. In reality both tend to rise.',
      'Only principal and interest appear in the amortisation schedule, because escrow items do not pay down the loan.',
      'Extra principal, if entered, is applied monthly after the scheduled payment.',
    ],
  },
  limitations: [
    'Private mortgage insurance is not calculated. Many lenders require it below 20% equity, which would add to the monthly cost shown here.',
    'Closing costs, points, origination fees and prepaid escrow are excluded entirely.',
    'Property tax and insurance are assumed constant. Escrow accounts are usually re-assessed every year.',
    'Adjustable-rate, interest-only and balloon mortgages are not modelled. The rate is fixed for the whole term.',
    'Nothing here accounts for tax relief on mortgage interest, which varies by country and by individual circumstances.',
  ],
  privacyNote:
    'Property prices, deposits and rates never leave your device. There is no account, no saved history and no server-side calculation.',
  resultDisclaimer:
    'Every figure on this page is an estimate for information only. It is not a mortgage offer, an affordability assessment or financial advice. Ask a qualified mortgage adviser or your lender for figures you can rely on.',
  faqs: [
    {
      question: 'Why is my lender quoting a higher payment than this?',
      answer:
        'The two most common reasons are private mortgage insurance, which applies at many lenders below 20% equity and is not calculated here, and escrow shortfalls from a tax or insurance re-assessment. Fees rolled into the loan will also raise the payment.',
    },
    {
      question: 'What does loan-to-value mean and why does it matter?',
      answer:
        'Loan-to-value is the loan as a percentage of the property price. It matters because lenders price risk against it — crossing below 80% typically unlocks better rates and removes mortgage insurance requirements in markets that have them.',
    },
    {
      question: 'Should I put down more or keep the cash?',
      answer:
        'A larger deposit reduces the loan, the monthly payment and the total interest, and the calculator will show you by how much. Whether that beats keeping an emergency fund or investing the difference depends on circumstances this tool cannot see.',
    },
    {
      question: 'How much interest will I really pay?',
      answer:
        'Over a long term, often a sum comparable to the loan itself. The total interest figure in the summary is the number to look at — and the extra-payment field shows how quickly that total falls when you overpay.',
    },
    {
      question: 'Does the start date change the calculation?',
      answer:
        'Not the amounts, only the labels. It lets the amortisation schedule show real months and years so you can see which calendar year a milestone falls in.',
    },
  ],
};
