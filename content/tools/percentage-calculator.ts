import type { ToolContent } from '../types';

export const percentageCalculatorContent: ToolContent = {
  slug: 'percentage-calculator',
  valueProposition:
    'Three percentage questions, one tool — and it shows the equation it solved.',
  intro:
    'Most percentage questions are really one of three questions: what is a percentage of a number, what percentage one number is of another, or how much a value changed between two points. This calculator handles all three, accepts negative numbers and decimals, and prints the substituted equation next to the answer so you can check the working. Display precision is adjustable from zero to ten decimal places while the full value is kept internally.',
  steps: [
    {
      title: 'Pick the question you are asking',
      body: 'Switch between "X% of Y", "X is what percent of Y" and "percentage change". Each mode relabels its fields so there is no guessing which number goes where.',
    },
    {
      title: 'Enter your two numbers',
      body: 'Decimals and negatives are both accepted. The result updates as you type; you do not need to press anything.',
    },
    {
      title: 'Set the display precision',
      body: 'Choose how many decimal places to show. Rounding affects the display only — the value copied to your clipboard matches what is on screen.',
    },
    {
      title: 'Read the equation, then copy the result',
      body: 'The substituted equation appears under the answer. Use the copy button to take the rounded result with you.',
    },
  ],
  example: {
    title: 'A 15% restaurant tip on a 68.40 bill',
    body: 'Choose the first mode, enter 15 as the percentage and 68.40 as the number.',
    rows: [
      { label: 'Equation', value: '68.40 × 15 ÷ 100' },
      { label: 'Tip', value: '10.26' },
      { label: 'Bill including tip', value: '78.66' },
    ],
    conclusion:
      'Switching to percentage-change mode with 68.40 and 78.66 returns a 15% increase, which is a useful way to confirm the first answer.',
  },
  method: {
    title: 'The three formulas',
    body: 'Each mode is a single arithmetic expression. Percentage change uses the absolute value of the starting number so that a change away from a negative starting point still reports its direction correctly.',
    formulas: [
      'What is X% of Y?          result = Y × X ÷ 100',
      'X is what percent of Y?   result = X ÷ Y × 100',
      'Change from X to Y        result = (Y − X) ÷ |X| × 100',
    ],
    notes: [
      'Mode two rejects a Y of zero: nothing can be a percentage of nothing.',
      'Mode three rejects a starting value of zero, because any increase from zero is undefined as a percentage rather than infinite.',
      'An increase and a decrease are labelled in words as well as by sign, so the direction is never conveyed by a minus sign alone.',
    ],
  },
  limitations: [
    'Percentage change from zero is undefined and is refused rather than shown as an enormous number.',
    'Results are rounded for display only. Chaining several rounded results by hand will drift from the exact value.',
    'This tool does not apply compounding. For growth repeated over multiple periods, use the compound interest calculator.',
  ],
  privacyNote:
    'The numbers you enter are never sent anywhere. The calculation happens in this page, in your browser.',
  faqs: [
    {
      question: 'How do I work out a percentage discount?',
      answer:
        'Use the first mode to find the discount amount — 20% of 85 is 17 — then subtract it from the original price to get 68. If you already know both prices, the third mode tells you the discount as a percentage: 85 to 68 is a 20% decrease.',
    },
    {
      question: 'Why is a 50% increase followed by a 50% decrease not back where I started?',
      answer:
        'Because each percentage is taken from a different base. 100 increased by 50% is 150; 50% of 150 is 75, not 50. Percentage changes do not cancel out, which is exactly why the tool prints the base it used.',
    },
    {
      question: 'What is the difference between percentage points and percent?',
      answer:
        'If a rate moves from 4% to 6%, that is a rise of two percentage points but a 50% increase. This calculator works in percent. Convert to percentage points by subtracting the two rates directly.',
    },
    {
      question: 'Can I use negative numbers?',
      answer:
        'Yes. All three modes accept negatives. In percentage-change mode the starting value is used as an absolute value for the denominator, so a move from −20 to −10 is reported as a 50% increase rather than a decrease.',
    },
    {
      question: 'How precise is the result?',
      answer:
        'The calculation is performed in double-precision arithmetic and only the displayed value is rounded, to between zero and ten decimal places as you choose. The default is two.',
    },
  ],
};
