import type { GuideContent } from './types';

/** Figures recomputed from `calculateCompoundInterest` in the guide tests. */
export const compoundInterestWithContributions: GuideContent = {
  slug: 'compound-interest-with-contributions',
  standfirst:
    'Compounding gets the headlines. On any realistic timescale, what you add each month does most of the work.',
  intro: [
    'Compound interest is usually introduced with a lump sum left alone for decades, which makes it look like a trick you either caught early or missed. Almost nobody actually saves that way. Real savings are a modest starting balance plus a regular contribution, and that changes both the arithmetic and the lesson.',
    'One example runs through this article: $5,000 to start, $200 a month, 7% a year compounded monthly, for 20 years. It ends at $124,379.03.',
  ],
  sections: [
    {
      heading: 'Where the money actually comes from',
      paragraphs: [
        'Split that final balance into its three sources and the picture is not what the usual telling suggests. The starting $5,000 is 4% of the total. The contributions — $200 a month for 240 months — come to $48,000. Interest accounts for $71,379.03.',
        'So interest is the largest single share, but it is interest earned mostly *on the contributions*, not on the opening balance. Leave the same $5,000 alone for the same 20 years at the same rate and it reaches $20,193.69. The contributions did not merely add $48,000; they added the $48,000 and then supplied the balance that earned most of the $71,379.',
        'This is why "start early" is good advice and "you already missed it" is not. The opening balance matters least of the three inputs. What matters is the size of the regular contribution and the number of years it has to work.',
      ],
      bullets: [
        'Opening balance: $5,000 — 4% of the final total.',
        'Contributions: $48,000 over 20 years.',
        'Interest: $71,379.03.',
        'The same $5,000 with no contributions: $20,193.69.',
      ],
    },
    {
      heading: 'Why the curve bends late',
      paragraphs: [
        'Interest is paid on the balance, and the balance is small at first. In year one the account earns a few hundred dollars, which feels like almost nothing beside the $2,400 contributed. The contributions dominate and the growth looks linear.',
        'That ratio inverts. As the balance grows, the interest it earns each year grows with it, until a single year of interest exceeds a whole year of contributions. From that point the account is doing more than you are, and the line visibly bends.',
        'The practical consequence is that the last few years of a long plan carry a disproportionate share of the result — which cuts both ways. It is why stopping five years early costs far more than five years of contributions, and why the middle years, when nothing seems to be happening, are the ones doing the setup.',
      ],
    },
    {
      heading: 'The settings that change the answer',
      paragraphs: [
        'Compounding frequency matters less than people expect. Moving from annual to monthly compounding at the same nominal rate is worth a fraction of a percent a year. It is real, it is not where the leverage is, and a calculator that makes a great deal of it is directing your attention badly.',
        'Contribution timing is a smaller effect still, but worth understanding because calculators differ on it. Paying at the start of each period rather than the end gives every contribution one extra period of growth: in our example, $124,986.77 instead of $124,379.03 — about $608 over twenty years. If two calculators disagree by roughly this margin, this is usually why.',
        'The rate is where the leverage lives, and it is also the input you control least. It is worth being honest that a "7%" assumption is a long-run average with wide variation around it, not a rate anyone pays you. The arithmetic is exact; the input is an estimate, and the output inherits that.',
      ],
    },
    {
      heading: 'What the projection leaves out',
      paragraphs: [
        'Three things, all of which make the real number smaller than the model.',
        'Inflation. A balance of $124,379 in twenty years does not buy what $124,379 buys today. At 2.5% inflation it is worth roughly $76,000 in present terms. Either use a real rate of return — the nominal rate minus inflation — or read the result as a future number and discount it yourself. Mixing the two is the most common error in this kind of planning.',
        'Tax and fees. Interest or gains may be taxable, and an annual management fee comes off the balance every year, which compounds against you exactly as growth compounds for you. A 1% fee on a 7% return is not 1% of the outcome; over twenty years it is a substantially larger share.',
        'Sequence. A steady 7% and an average 7% delivered as a volatile series do not end in the same place once contributions are involved, because the balance being exposed differs each year. A smooth projection is a central estimate, not a forecast.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Is it better to invest a lump sum or contribute monthly?',
      answer:
        'A lump sum invested earlier has longer to compound, so mathematically it wins when the rate is positive. Monthly contributing is what most people can actually do, and the comparison is usually academic — the real choice is contributing regularly or not at all.',
    },
    {
      question: 'How much difference does compounding frequency make?',
      answer:
        'Less than most people assume. Annual to monthly at the same nominal rate is worth a fraction of a percent a year. Contribution size and time invested both dominate it by a wide margin.',
    },
    {
      question: 'Should contributions be set to the beginning or end of the period?',
      answer:
        'End of period is the conservative default and matches how most people actually save — you contribute after being paid. Beginning-of-period gives each contribution one extra period of growth, worth about $608 on the twenty-year example here.',
    },
    {
      question: 'Does this account for inflation?',
      answer:
        'No. The result is a future nominal amount. To think in today’s money, either subtract inflation from the rate before calculating, or discount the final figure afterwards — but not both, which double-counts.',
    },
    {
      question: 'What rate should I assume?',
      answer:
        'Whatever you use, treat it as an estimate with wide error bars rather than a rate anyone has promised you. Running the projection two or three times across a plausible range tells you more than a single confident number.',
    },
  ],
  keyPoints: [
    'On a 20-year plan the regular contribution matters far more than the opening balance.',
    'In the worked example, $5,000 grows to $20,193.69 alone but to $124,379.03 with $200 a month added.',
    'The curve bends late, so the final years carry a disproportionate share of the result.',
    'Compounding frequency and contribution timing are small effects; the rate and the years are large ones.',
    'The projection ignores inflation, tax and fees, all of which reduce the real outcome.',
  ],
};
