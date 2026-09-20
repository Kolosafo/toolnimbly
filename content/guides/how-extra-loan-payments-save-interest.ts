import type { GuideContent } from './types';

export const howExtraLoanPaymentsSaveInterest: GuideContent = {
  slug: 'how-extra-loan-payments-save-interest',
  standfirst:
    'Extra payments can shorten a fixed-rate loan because principal removed today is no longer present to generate interest in later months.',
  intro: [
    'A standard fixed-rate loan has a scheduled payment designed to reduce the balance to zero over a set number of months. The payment may stay level, but its composition changes: interest is calculated on the remaining principal, and whatever is left reduces that principal.',
    'An extra payment aimed at principal moves the balance down sooner than the original schedule. The following month’s interest is then calculated on a smaller amount. That produces another small principal advantage, and the effect repeats until the loan finishes earlier or the payment is recalculated.',
    'The saving depends on the rate, remaining term, timing and the lender’s rules. Some agreements charge a prepayment penalty, cap overpayments, hold money for a future instalment or require a specific instruction before applying it to principal. Confirm the real treatment before relying on a projection.',
  ],
  sections: [
    {
      heading: 'How fixed-rate amortization splits a payment',
      paragraphs: [
        'For a monthly fixed-rate loan, the periodic rate is the annual rate divided by 12. Each month’s interest is that periodic rate multiplied by the balance entering the month. Principal paid is the scheduled payment minus interest. The next month starts with the reduced balance.',
        'Early in the term the balance is large, so interest takes a larger share. Later, interest falls and more of the same payment reaches principal. This is sometimes described as front-loaded interest, but the rate has not been moved forward: applying the same rate to a larger early balance naturally creates that pattern.',
        'The Consumer Financial Protection Bureau explains this principal-versus-interest mechanism in the context of mortgages. A mortgage has additional features and costs, but the fixed-payment amortization example illustrates the same balance mechanics used by this general calculator. The CFPB does not validate or endorse ToolNimbly’s calculations.',
      ],
    },
    {
      heading: 'Why earlier principal reduction matters',
      paragraphs: [
        'If an extra 100 reduces principal this month, next month’s interest is calculated without that 100 in the balance. More of the next scheduled payment can therefore reduce principal. The benefit compounds through the remaining schedule, although the amount saved is governed by the loan rate rather than by an investment return.',
        'Timing matters. An extra payment near the start can avoid interest across many remaining periods; the same amount near the final payment has little time to help. A higher-rate loan also creates a larger interest reduction from the same early principal payment, all else equal.',
        'Paying extra is not automatically the best use of cash. An emergency reserve, more expensive debt, a contractual penalty or other priorities can change the decision. The calculator shows loan arithmetic, not personalised financial advice.',
      ],
    },
    {
      heading: 'Worked example with an extra monthly payment',
      paragraphs: [
        'Take a 25,000 loan at a fixed 7.5% annual rate over five years. With monthly payments and no fees, the scheduled payment is 500.95. Across the original 60-month schedule, total interest is 5,056.92 and total paid is 30,056.92, subject to the lender’s rounding method.',
        'Now add 100 after every scheduled payment and direct it to principal. Under the calculator’s method the loan finishes 11 months earlier and interest falls by 1,013.61. The last payment is capped at the remaining principal plus interest rather than collecting a full unnecessary instalment.',
        'Those figures assume every extra payment is made, the rate remains fixed, there is no penalty, and the lender applies the money immediately to principal. Missing payments, daily accrual, fees or a different application date will change the real outcome.',
      ],
      bullets: [
        'Original schedule: 500.95 per month for 60 months.',
        'Original interest: 5,056.92.',
        'With 100 extra per month: payoff 11 months earlier.',
        'Projected interest saving: 1,013.61.',
      ],
    },
    {
      heading: 'What to ask the lender before paying extra',
      paragraphs: [
        'Ask whether overpayments are allowed, whether a penalty or annual limit applies, and how to mark the payment as principal-only. Also ask whether the lender will shorten the term or re-amortize the balance to reduce future scheduled payments. The same principal reduction can lead to different cash-flow outcomes.',
        'Check the next statement. The balance should have fallen by the scheduled principal plus the intended extra amount. If the due date simply moved forward, the lender may have treated the money as an advance instalment rather than immediate principal reduction, which may not produce the saving you expected.',
        'For loans with daily interest, the date funds arrive matters. For variable-rate, interest-only, balloon or fee-heavy products, a simple fixed-rate schedule is not an adequate model. Request an official payoff or amortization statement when an exact decision depends on it.',
      ],
    },
    {
      heading: 'Compare the baseline and extra-payment schedules',
      paragraphs: [
        'A useful comparison keeps the loan amount, rate, start point and original term unchanged, then changes only the extra payment. Compare total interest, number of payments and final payoff time. Looking only at the new monthly outflow hides the reason for doing the exercise.',
        'Download or save both schedules if you need an audit trail for the scenario. Treat them as estimates and compare the opening balances with the lender’s statement. A small difference can arise from rounding or daily versus monthly accrual; a large difference often signals fees, a variable rate or a different extra-payment treatment.',
      ],
    },
  ],
  sources: [
    {
      label: 'Consumer Financial Protection Bureau — How paying down a mortgage works',
      url: 'https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/',
    },
  ],
  cta: {
    heading: 'Compare your schedule with and without extra payments',
    body: 'Enter the same loan twice—or change the extra-payment field—to see the projected payoff time, interest and full amortization schedule.',
    label: 'Open the loan calculator',
    href: '/tools/loan-calculator',
  },
  faqs: [
    {
      question: 'Does every extra payment reduce principal immediately?',
      answer:
        'No. Some lenders apply it to principal, some advance the next due date, and some require a specific instruction. Contracts may also limit or penalise overpayments. Confirm the policy and check the following statement before assuming the projected saving applies.',
    },
    {
      question: 'Will paying extra lower my required monthly payment?',
      answer:
        'Often it shortens the term while the required payment stays the same. A lender may offer re-amortization or recasting, which lowers future payments over the remaining term, but that is a separate process and may involve conditions or a fee.',
    },
    {
      question: 'Why does an early extra payment save more?',
      answer:
        'It removes principal from more future interest calculations. An identical payment near the end has only a few periods left in which to reduce interest. Rate and remaining term therefore determine how much timing matters.',
    },
    {
      question: 'Why does my lender’s schedule differ from the calculator?',
      answer:
        'The lender may accrue interest daily, round differently, include fees, use a different first-payment interval or apply extra money on another date. Use the calculator for comparison and planning, then rely on the lender’s official statement for contractual amounts.',
    },
  ],
  keyPoints: [
    'Interest is calculated on the remaining principal, so reducing principal earlier can reduce later interest.',
    'The same fixed payment shifts from more interest to more principal as the balance falls.',
    'Extra-payment treatment, limits and penalties depend on the lender and contract.',
    'Compare payoff time and total interest, and verify the projected treatment on the next statement.',
  ],
};
