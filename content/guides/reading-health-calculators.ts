import type { GuideContent } from './types';

/**
 * Health content, written deliberately conservatively: every claim is framed as
 * what the formula does and what it omits, and the article repeatedly points
 * outside itself for anything resembling advice. The tools themselves carry the
 * same framing, so the two cannot drift into contradiction.
 */
export const readingHealthCalculators: GuideContent = {
  slug: 'reading-health-calculators',
  standfirst:
    'BMI and daily calorie figures are population averages applied to an individual. That is useful, and it is not the same as a measurement.',
  intro: [
    'Health calculators produce confident numbers. A BMI to one decimal place, a daily calorie requirement to the nearest unit. The precision is real arithmetic, but it describes the formula, not you: both figures are derived from equations fitted to large groups of people, and an equation fitted to a population cannot know which member of it you are.',
    'That does not make them worthless. It makes them a starting point that needs interpreting. This explains what each one actually measures, the specific cases where it is known to mislead, and what to do with the answer.',
    'Nothing here is medical advice. If a number concerns you, or you are making a decision that matters, the right next step is a clinician who can measure what a formula can only estimate.',
  ],
  sections: [
    {
      heading: 'What BMI actually measures',
      paragraphs: [
        'Body mass index is weight divided by the square of height. That is the entire calculation. It contains no information about muscle, fat, bone density, where weight is carried, or anything else — because none of those were inputs.',
        'It was devised in the nineteenth century as a way of describing populations and was never intended as an individual diagnostic. It survives because it is cheap, needs no equipment, and correlates well enough across large groups to be useful for public-health screening. Those are real virtues at population scale and they do not transfer cleanly to one person.',
        'The squaring is also a known distortion. Because it scales with height squared while bodies scale closer to height cubed, BMI tends to read high for tall people and low for short people of identical build. This is a property of the formula, not a finding about them.',
      ],
    },
    {
      heading: 'Where BMI is known to mislead',
      paragraphs: [
        'The clearest failure is muscle. Muscle is denser than fat, so a well-trained athlete can land in the "overweight" or even "obese" band while carrying very little fat. The number is arithmetically correct and clinically meaningless in that case.',
        'The opposite failure is less discussed and more consequential: someone can sit squarely in the healthy band while carrying a high proportion of fat and very little muscle. BMI cannot see this at all, and a reassuring number can delay a conversation worth having.',
        'The standard adult categories are also derived largely from European-ancestry populations, and several health bodies apply lower thresholds for people of South Asian, Chinese and other ancestries, where metabolic risk appears at a lower BMI. And the adult categories do not apply to children and adolescents at all, who are assessed against age and sex percentiles instead.',
      ],
      bullets: [
        'Muscular build: BMI reads high, and the category does not apply.',
        'Low muscle mass: BMI can read normal while body composition is not.',
        'Ancestry: some health bodies use lower thresholds; check what applies to you.',
        'Under 18, pregnant, or over about 65: adult categories do not apply.',
      ],
    },
    {
      heading: 'Where a daily calorie number comes from',
      paragraphs: [
        'A daily calorie estimate is built in two steps. First, a resting metabolic rate: the energy your body uses doing nothing at all, which is the large majority of daily expenditure. The Mifflin-St Jeor equation is the one most commonly recommended for healthy adults, and it takes weight, height, age and sex as inputs.',
        'Second, that resting figure is multiplied by an activity factor to account for everything you actually do. This is where most of the uncertainty enters. The multipliers are coarse bands with plain-language labels, and people are poor judges of which band they belong to — "moderately active" is claimed far more often than it is true.',
        'Both steps are population averages. Individual resting metabolic rates vary meaningfully from the equation’s prediction even among people with identical inputs, because the equation has no way to see body composition, thyroid function, medication or genetics. Treat the output as a starting hypothesis to be adjusted against what actually happens.',
      ],
    },
    {
      heading: 'Using the numbers without over-trusting them',
      paragraphs: [
        'The most useful property of both figures is not their absolute value but their direction over time. One BMI reading is a weak signal; the same measurement taken the same way over a year is a much stronger one. A calorie estimate that turns out to be 200 too high becomes accurate the moment you adjust it against real observed change.',
        'It also helps to pair each number with something it cannot see. Waist circumference, or waist-to-height ratio, captures where weight is carried, which BMI cannot, and is measurable with a tape. For energy needs, two or three weeks of consistent weight data tells you more about your real requirement than any equation can.',
        'And treat a precise-looking figure with appropriate suspicion. A calculator that reports 2,347 calories is reporting the formula’s arithmetic, not a measurement accurate to the calorie. Rounding to the nearest fifty is a more honest representation of what is actually known.',
      ],
    },
  ],
  faqs: [
    {
      question: 'Is BMI accurate for athletes?',
      answer:
        'No. Muscle is denser than fat, so a muscular build produces a high BMI regardless of body fat. The arithmetic is correct and the category is not informative. Body composition measurement is the appropriate alternative where it matters.',
    },
    {
      question: 'Why does BMI use different thresholds for different populations?',
      answer:
        'Because the risk associated with a given BMI varies between ancestry groups. Several health bodies apply lower thresholds for people of South Asian and Chinese ancestry, where metabolic risk appears at a lower index. Which thresholds apply to you is a question for a clinician.',
    },
    {
      question: 'How accurate is a calorie calculator?',
      answer:
        'The resting rate is usually within a modest margin for most healthy adults, but individual variation is real. The larger error is the activity multiplier, which is self-selected from coarse bands. Expect the estimate to need adjusting once you see what actually happens.',
    },
    {
      question: 'Which activity level should I choose?',
      answer:
        'Lower than you think, in most cases. The bands describe sustained activity across the whole week, not your best days, and deliberate exercise is a smaller share of daily expenditure than people expect. Start conservative and adjust upward against real observation.',
    },
    {
      question: 'Does age change the calculation?',
      answer:
        'Yes, for calories: the Mifflin-St Jeor equation takes age directly, and predicted resting rate falls as age rises. BMI ignores age entirely for adults, which is one of its known weaknesses — body composition changes with age while the formula does not.',
    },
  ],
  keyPoints: [
    'BMI is weight over height squared, and contains no information about body composition.',
    'It can read high for muscular builds and reassuringly normal for low-muscle ones.',
    'Adult BMI categories do not apply to children, and thresholds vary by ancestry.',
    'A calorie estimate is a population equation plus a self-selected activity band — the band is the bigger source of error.',
    'Both numbers are most useful as a trend measured consistently, not as a single reading.',
  ],
};
