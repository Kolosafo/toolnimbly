import type { GuideContent } from './types';

/**
 * Every figure quoted here comes from `buildAmortization` and is pinned by a
 * test, so the article cannot drift away from the calculator it describes.
 */
export const howLoanInterestWorks: GuideContent = {
  slug: 'how-loan-interest-works',
  standfirst:
    'Interest is rent on the money you still owe. Once that lands, everything else about a loan follows from it.',
  intro: [
    'Most explanations of loan interest start with a formula. That is the wrong end. The formula is a consequence of one idea: interest is rent charged on the balance you have not yet repaid. Charge that rent every month on a balance that is falling, and every feature people find surprising about loans — the front-loaded interest, the modest effect of a shorter term, the outsized effect of a small extra payment — stops being surprising.',
    'The examples below use one loan throughout: $25,000 borrowed at 6% over five years. Its monthly payment is $483.32, and over the full term it costs $3,999.20 in interest.',
  ],
  sections: [
    {
      heading: 'The payment is fixed; what it buys is not',
      paragraphs: [
        'A fixed-rate instalment loan charges you the same amount every month, but that payment is doing two different jobs, and the split between them moves every single month.',
        'In the first month you owe the whole $25,000. One month of rent at 6% a year is 6% ÷ 12 = 0.5%, which is $125.00. Your payment is $483.32, so $125.00 goes to the lender as interest and the remaining $358.32 reduces what you owe. Next month the rent is charged on $24,641.68 instead, so it is slightly smaller, and slightly more of the payment goes to the balance.',
        'By the final payment there is almost nothing left to charge rent on: interest is $2.40 and $480.92 clears the balance. Nothing about the loan changed. The balance did.',
      ],
      bullets: [
        'First payment: $125.00 interest, $358.32 principal — 25.9% of the payment is interest.',
        'Final payment: $2.40 interest, $480.92 principal.',
        'The payment never moves. Only its composition does.',
      ],
    },
    {
      heading: 'Why the halfway point is not halfway',
      paragraphs: [
        'After 30 of the 60 payments on this loan you have handed over $14,499.60 — exactly half the total. You might reasonably expect half the debt to be gone. It is not: the balance is $13,433.42, so you have repaid $11,566.58, or 46% of what you borrowed.',
        'Four percentage points is a small gap on a five-year loan at a modest rate. Stretch the term or raise the rate and it widens sharply, which is the real reason the "you are still paying mostly interest" complaint attaches to mortgages rather than to car loans. On a 30-year mortgage the halfway point by time is nowhere near the halfway point by debt.',
        'This is also why selling or refinancing early feels worse than expected. You have not been cheated; you have simply been renting a large balance for the whole period, and the balance only falls slowly at first.',
      ],
    },
    {
      heading: 'What the interest rate leaves out',
      paragraphs: [
        'A rate tells you the rent on the balance. It does not tell you what the loan costs, because it says nothing about the fees required to obtain it. An arrangement fee, an origination fee, mandatory insurance or a broker commission are all real costs of borrowing, and none of them appear in the rate.',
        'APR exists to close that gap. It expresses the rate plus the compulsory charges as a single annual percentage, which is what makes two offers comparable. A loan at 5.9% with a $600 arrangement fee can easily cost more than one at 6.3% with no fee, and comparing the rates alone will send you to the wrong lender.',
        'Two cautions. First, what counts as a compulsory charge is set by regulation and differs between countries, so an APR is comparable to another APR from the same market, not across borders. Second, APR assumes you keep the loan to term; repay early and the fees are spread over a shorter period, so the effective cost rises.',
      ],
    },
    {
      heading: 'What an extra payment actually buys',
      paragraphs: [
        'Because interest is charged on the balance, money paid into the balance stops being rented. That makes an extra payment worth far more than its face value, and worth most when it is made early — while the balance, and therefore the rent, is largest.',
        'Add $50 a month to our loan. The payment becomes $533.32, and the loan clears in 54 months instead of 60. Total interest falls from $3,999.20 to $3,558.29: a saving of $440.91, and six payments you never make.',
        'Look at what that cost. You paid an extra $50 for 53 full months, around $2,650, and in exchange you avoided $440.91 of interest and finished half a year early. The saving is real and reliable, but it is a return on the money, not free money — which is the honest way to compare it against paying down a more expensive debt or, where the rate is low, investing instead.',
      ],
      bullets: [
        'Without the extra payment: 60 payments, $3,999.20 interest.',
        'With $50 a month extra: 54 payments, $3,558.29 interest.',
        'Difference: six months and $440.91.',
      ],
    },
    {
      heading: 'The same machine, pointed the other way',
      paragraphs: [
        'Compound interest on savings is this mechanism running in your favour. On a loan, interest is charged on a balance you are trying to shrink; on savings, it is paid on a balance you are trying to grow, and it is then paid again on the interest already earned.',
        'The asymmetry worth internalising is one of direction, not of mathematics. A debt left alone grows; savings left alone grow. Which of those is happening to you is decided by which side of the balance you are on — and it is why repaying an expensive debt is so often a better use of money than saving at a lower rate, with no risk and no forecast required.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Why is so much of my early payment going to interest?',
      answer:
        'Because interest is charged on what you still owe, and early on you still owe nearly everything. On a $25,000 loan at 6%, the first month’s interest is $125.00 of a $483.32 payment. Nothing is being taken unfairly — the balance simply has not fallen yet.',
    },
    {
      question: 'Is it better to shorten the term or to pay extra each month?',
      answer:
        'They are close to the same thing, with one difference that matters. A shorter term contractually commits you to the higher payment; voluntary extra payments do not, so you can stop in a difficult month. A shorter term is usually offered at a slightly lower rate, so compare the two directly rather than assuming.',
    },
    {
      question: 'What is the difference between the interest rate and the APR?',
      answer:
        'The rate is the rent on the balance. The APR is the rate plus the compulsory fees, expressed as one annual percentage, which is what lets you compare offers. A lower rate with a large arrangement fee can be the more expensive loan.',
    },
    {
      question: 'Does paying extra reduce my monthly payment?',
      answer:
        'Usually not. Most lenders apply extra money to the principal and keep the payment the same, so the loan finishes earlier instead. Some will re-amortise on request and lower the payment over the original term. The two outcomes are very different, so ask which one you are getting.',
    },
    {
      question: 'Why do two calculators give slightly different answers?',
      answer:
        'Rounding and day-count conventions. Lenders differ on whether interest accrues monthly or daily, on how a part-month is handled, and on when rounding happens. Differences of a few cents a month are normal; differences of several dollars usually mean fees are included somewhere.',
    },
  ],
  keyPoints: [
    'Interest is rent on the balance you have not repaid, charged again every month.',
    'The payment stays fixed while the split between interest and principal moves the whole way through the term.',
    'Halfway through the payments is not halfway through the debt, and the gap widens with longer terms and higher rates.',
    'APR, not the interest rate, is what makes two offers comparable.',
    'Extra payments are worth most early, because that is when the balance being rented is largest.',
  ],
};
