/**
 * Supporting articles (SEO brief §5).
 *
 * Thirty tools with no connective tissue read as thirty unrelated widgets. A
 * guide per cluster gives each group a piece of writing that explains the
 * subject rather than operating a control, and gives the hub and the tools
 * something substantive to link to.
 *
 * A guide is not a tool: it has no interactive panel, and it earns its place by
 * answering a question a person would ask before they knew which tool they
 * needed.
 */

import type { ToolCategory } from './types';

export type GuideDefinition = {
  /** URL segment under `/guides/`. */
  readonly slug: string;
  /** Page H1. */
  readonly name: string;
  /** `<title>` content, excluding the site-name suffix. 20–60 characters. */
  readonly title: string;
  /** Meta description and card summary. 110–165 characters. */
  readonly description: string;
  /** The cluster this guide supports. */
  readonly category: ToolCategory;
  /** The single search intent this article serves. */
  readonly primaryKeyword: string;
  /** Tools this guide links into. Three or more, all in or adjacent to its cluster. */
  readonly relatedToolSlugs: readonly string[];
  /** ISO date of the last editorial review. */
  readonly updatedAt: string;
};

export const guides: readonly GuideDefinition[] = [
  {
    slug: 'compound-interest-with-contributions',
    name: 'Compound interest with regular contributions',
    title: 'Compound Interest with Contributions',
    description:
      'Learn how principal, compounding frequency and contribution timing shape savings growth, with a worked monthly-contribution example.',
    category: 'calculators',
    primaryKeyword: 'compound interest with contributions',
    relatedToolSlugs: [
      'compound-interest-calculator',
      'percentage-calculator',
      'salary-calculator',
    ],
    updatedAt: '2026-09-20',
  },
  {
    slug: 'how-extra-loan-payments-save-interest',
    name: 'How extra loan payments save interest',
    title: 'How Extra Loan Payments Save Interest',
    description:
      'See why paying principal earlier can shorten a fixed-rate loan and reduce later interest, with a worked example and lender caveats.',
    category: 'calculators',
    primaryKeyword: 'how extra loan payments save interest',
    relatedToolSlugs: ['loan-calculator', 'mortgage-calculator', 'percentage-calculator'],
    updatedAt: '2026-09-20',
  },
  {
    slug: 'how-to-convert-salary-to-hourly',
    name: 'How to convert salary to hourly pay',
    title: 'How to Convert Salary to Hourly Pay',
    description:
      'Convert annual salary to an hourly rate—or hourly pay to annual salary—using realistic hours, paid weeks and gross-pay assumptions.',
    category: 'calculators',
    primaryKeyword: 'how to convert salary to hourly',
    relatedToolSlugs: ['salary-calculator', 'percentage-calculator', 'date-difference-calculator'],
    updatedAt: '2026-09-20',
  },
  {
    slug: 'how-loan-interest-works',
    name: 'How loan interest actually works',
    title: 'How Loan Interest Works',
    description:
      'Why your early payments are nearly all interest, what APR includes that a rate does not, and what an extra $50 a month really buys you.',
    category: 'calculators',
    primaryKeyword: 'how loan interest works',
    relatedToolSlugs: [
      'loan-calculator',
      'mortgage-calculator',
      'compound-interest-calculator',
      'percentage-calculator',
    ],
    updatedAt: '2026-09-19',
  },
  {
    slug: 'choosing-a-strong-password',
    name: 'Choosing a strong password: length beats complexity',
    title: 'How to Choose a Strong Password',
    description:
      'Why a long passphrase beats a short tangle of symbols, what password entropy measures, and the advice that has quietly been withdrawn.',
    category: 'text-developer-tools',
    primaryKeyword: 'how to choose a strong password',
    relatedToolSlugs: ['password-generator', 'uuid-generator', 'qr-code-generator'],
    updatedAt: '2026-09-19',
  },
  {
    slug: 'choosing-an-image-format',
    name: 'JPG, PNG or WebP: choosing an image format',
    title: 'JPG vs PNG vs WebP',
    description:
      'Which image format to use and why, what lossy compression actually discards, and the conversions that cost you quality for nothing.',
    category: 'image-tools',
    primaryKeyword: 'jpg vs png',
    relatedToolSlugs: [
      'image-compressor',
      'jpg-compressor',
      'png-compressor',
      'png-to-jpg',
      'jpg-to-png',
      'image-resizer',
      'image-cropper',
    ],
    updatedAt: '2026-09-19',
  },
  {
    slug: 'why-pdfs-are-large',
    name: 'Why PDF files get so large, and what actually shrinks them',
    title: 'Why PDF Files Are So Large',
    description:
      'Scanned pages, embedded fonts and images saved at print resolution — where the megabytes really go, and which fixes are worth trying.',
    category: 'pdf-tools',
    primaryKeyword: 'why are pdf files so large',
    relatedToolSlugs: [
      'pdf-compressor',
      'pdf-splitter',
      'pdf-merger',
      'image-to-pdf',
      'jpg-to-pdf',
      'pdf-to-jpg',
    ],
    updatedAt: '2026-09-19',
  },
  {
    slug: 'what-a-payment-receipt-should-include',
    name: 'What a payment receipt should include',
    title: 'What a Payment Receipt Should Include',
    description:
      'Learn the common fields on a useful payment receipt, how it differs from an invoice, and where local numbering and record rules apply.',
    category: 'business-tools',
    primaryKeyword: 'what should a payment receipt include',
    relatedToolSlugs: ['receipt-generator', 'invoice-generator', 'percentage-calculator'],
    updatedAt: '2026-09-20',
  },
  {
    slug: 'what-an-invoice-must-contain',
    name: 'What an invoice needs to contain',
    title: 'What to Include on an Invoice',
    description:
      'The fields that make an invoice usable, why a unique number matters more than the layout, and where local tax rules take over.',
    category: 'business-tools',
    primaryKeyword: 'what to include on an invoice',
    relatedToolSlugs: ['invoice-generator', 'receipt-generator', 'percentage-calculator'],
    updatedAt: '2026-09-19',
  },
  {
    slug: 'counting-words-and-characters',
    name: 'Counting words and characters: why the numbers disagree',
    title: 'Word and Character Counts',
    description:
      'Graphemes, code units and bytes all claim to be characters. Which one your limit means, and why two tools report different totals.',
    category: 'text-developer-tools',
    primaryKeyword: 'word count vs character count',
    relatedToolSlugs: ['word-counter', 'character-counter', 'case-converter'],
    updatedAt: '2026-09-20',
  },
  {
    slug: 'reading-health-calculators',
    name: 'Reading health calculators honestly',
    title: 'What BMI and Calorie Numbers Mean',
    description:
      'BMI is weight over height squared and knows nothing else. Daily calorie figures are population equations. What both can and cannot tell you.',
    category: 'calculators',
    primaryKeyword: 'what does bmi actually measure',
    relatedToolSlugs: ['bmi-calculator', 'calorie-calculator', 'age-calculator'],
    updatedAt: '2026-09-20',
  },
];

export const EXPECTED_GUIDE_COUNT = 11;
