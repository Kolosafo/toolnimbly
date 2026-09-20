import type { GuideContent } from './types';

export const howToConvertSalaryToHourly: GuideContent = {
  slug: 'how-to-convert-salary-to-hourly',
  standfirst:
    'Salary and hourly pay become comparable only after you state the hours and paid weeks behind them—and keep gross pay separate from take-home pay.',
  intro: [
    'To convert an annual salary to an hourly rate, divide the annual amount by the paid hours in the year. The arithmetic is simple; deciding how many paid hours belong in the denominator is the important part. A 40-hour week and 52 paid weeks are common defaults, not universal rules.',
    'The reverse conversion uses the same assumptions: multiply an hourly rate by hours per week and paid weeks per year. This gives gross annual pay before tax and deductions. It does not calculate take-home pay, overtime premiums, bonuses, benefits or any country’s payroll rules.',
    'Write the assumptions beside the answer whenever you compare jobs. Two people on the same annual salary can have very different effective hourly rates if one works longer weeks, and the same hourly rate can produce different annual totals when unpaid leave or part-time schedules differ.',
  ],
  sections: [
    {
      heading: 'The two core formulas',
      paragraphs: [
        'Annual to hourly: hourly rate = annual salary ÷ (hours per week × paid weeks per year). Hourly to annual: annual pay = hourly rate × hours per week × paid weeks per year. These are exact inverses when the same assumptions are used in both directions.',
        'For daily pay, include workdays as well as hours. Daily gross pay can be calculated as annual pay ÷ (workdays per week × paid weeks per year), or as hourly pay × hours per workday when the schedule is regular. A daily rate quoted for contract work may cover different hours or costs, so do not assume it maps to an employee day without checking.',
        'Monthly pay is normally annual ÷ 12. Weekly is annual ÷ paid weeks for a work-rate comparison, while a payroll system may spread a fixed annual salary across calendar pay periods even when some weeks contain leave. Be clear about whether you are comparing earning rates or describing an employer’s payslip schedule.',
      ],
    },
    {
      heading: 'Worked example using 40 hours and 52 paid weeks',
      paragraphs: [
        'Suppose the annual salary is 62,000. Assume—explicitly—that the job pays for 40 hours a week and 52 weeks a year. That is 2,080 paid hours. Divide 62,000 by 2,080 to get 29.8077, which rounds to 29.81 per hour.',
        'The same annual amount is 1,192.31 per week and 5,166.67 per month. If the role is five days a week, the daily equivalent is 238.46. These figures are gross pay before tax and deductions; no payroll withholding has been estimated.',
        'Reverse the calculation to check it: 29.8077 × 40 × 52 returns 62,000 apart from display rounding. If you start from the rounded 29.81 instead, the annual result will differ slightly because the hourly figure has already lost decimal places.',
      ],
      bullets: [
        'Assumption: 40 paid hours per week × 52 paid weeks = 2,080 hours.',
        '62,000 ÷ 2,080 = 29.81 hourly, rounded to two decimals.',
        '62,000 ÷ 12 = 5,166.67 monthly gross pay.',
        'All values are before tax, pension, insurance and other deductions.',
      ],
    },
    {
      heading: 'Paid weeks, unpaid leave and part-time schedules',
      paragraphs: [
        'A salaried employee whose annual salary continues during paid holiday normally uses 52 paid weeks. An hourly contractor who takes four unpaid weeks might use 48. At the same weekly hours and rate, reducing paid weeks lowers annual pay but does not lower the hourly rate.',
        'For part-time work, use the actual contracted or typical hours. Someone working 22 hours across three days should enter 22 hours and three workdays, not scale a full-time salary by instinct. Irregular hours need an average drawn from a representative period, and that average should be labelled as such.',
        'Unpaid breaks usually do not count as work hours, while paid breaks may. The contract and local rules decide. This guide does not interpret employment law; it explains the arithmetic once the relevant paid hours are known.',
      ],
    },
    {
      heading: 'Biweekly and semimonthly are not the same',
      paragraphs: [
        'Biweekly means every two weeks, producing 26 pay periods in a typical year. Semimonthly means twice a month, producing 24. An annual salary divided by 26 therefore gives a smaller individual payment than the same salary divided by 24, even though the annual total is unchanged.',
        'On 62,000, a biweekly equivalent is 2,384.62 and a semimonthly equivalent is 2,583.33. Biweekly schedules sometimes create months with three payments; semimonthly schedules normally pay on two set dates. Do not multiply a biweekly cheque by 24 or a semimonthly cheque by 26.',
      ],
    },
    {
      heading: 'What a gross-pay conversion cannot tell you',
      paragraphs: [
        'Gross pay is the amount before income tax, social contributions, pension deductions, insurance and other withholdings. Net or take-home pay depends on jurisdiction and personal circumstances, so a country-neutral salary converter should not guess it.',
        'The comparison also excludes employer benefits, bonuses, commission, overtime premiums, paid leave quality and expenses that a contractor must cover personally. A lower headline salary with strong benefits can be worth more than a higher figure with none. Use the hourly conversion as one comparable measure, not as a complete job valuation.',
        'Overtime rules vary and may change which hours belong at the ordinary rate. Entering a longer week simply spreads gross pay across more hours; it does not calculate a legally required premium or determine whether a worker is eligible for one.',
      ],
    },
  ],
  cta: {
    heading: 'Convert using your actual working pattern',
    body: 'Enter annual or hourly gross pay, then adjust hours, workdays and paid weeks so the comparison reflects your schedule.',
    label: 'Open the salary to hourly calculator',
    href: '/tools/salary-calculator',
  },
  faqs: [
    {
      question: 'How many work hours are in a year?',
      answer:
        'The familiar 2,080 figure assumes 40 hours a week for 52 paid weeks. It is not universal. Part-time hours, unpaid leave and different standard weeks change the number, so use actual paid hours whenever possible.',
    },
    {
      question: 'Should paid holiday reduce the weeks per year?',
      answer:
        'Not when the annual salary continues during the holiday. In that case the leave is paid and 52 paid weeks usually remains the correct denominator. Reduce the number for weeks in which no pay is earned, such as unpaid leave for an hourly or contract worker.',
    },
    {
      question: 'Is the hourly result take-home pay?',
      answer:
        'No. It is a gross-pay equivalent before tax and deductions. Take-home pay depends on country, tax status, benefits and payroll choices that are outside a general conversion. Do not use the figure as a net-pay promise.',
    },
    {
      question: 'Why does my payslip differ from the monthly equivalent?',
      answer:
        'Payroll can use biweekly, semimonthly or other schedules, apply deductions, include variable hours, or round at different stages. Check the pay frequency first: annual divided by 12 describes monthly gross pay, not a biweekly cheque or a net deposit.',
    },
  ],
  keyPoints: [
    'Hourly rate equals annual gross pay divided by paid hours in the year.',
    'Forty hours and 52 paid weeks are editable assumptions, not universal facts.',
    'Biweekly means 26 payments; semimonthly means 24.',
    'The conversion is gross pay before tax and deductions and excludes benefits and overtime rules.',
  ],
};
