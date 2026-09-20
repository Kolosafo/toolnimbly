import { choosingAnImageFormat } from './choosing-an-image-format';
import { countingWordsAndCharacters } from './counting-words-and-characters';
import { choosingAStrongPassword } from './choosing-a-strong-password';
import { howLoanInterestWorks } from './how-loan-interest-works';
import { howExtraLoanPaymentsSaveInterest } from './how-extra-loan-payments-save-interest';
import { howToConvertSalaryToHourly } from './how-to-convert-salary-to-hourly';
import { readingHealthCalculators } from './reading-health-calculators';
import type { GuideContent } from './types';
import { compoundInterestWithContributions } from './compound-interest-with-contributions';
import { whatAPaymentReceiptShouldInclude } from './what-a-payment-receipt-should-include';
import { whatAnInvoiceMustContain } from './what-an-invoice-must-contain';
import { whyPdfsAreLarge } from './why-pdfs-are-large';

export type { GuideContent, GuideSection } from './types';

const modules: readonly GuideContent[] = [
  compoundInterestWithContributions,
  howExtraLoanPaymentsSaveInterest,
  howToConvertSalaryToHourly,
  howLoanInterestWorks,
  choosingAStrongPassword,
  choosingAnImageFormat,
  whyPdfsAreLarge,
  whatAPaymentReceiptShouldInclude,
  whatAnInvoiceMustContain,
  countingWordsAndCharacters,
  readingHealthCalculators,
];

const bySlug = new Map(modules.map((guide) => [guide.slug, guide]));

export function findGuideContent(slug: string): GuideContent | undefined {
  return bySlug.get(slug);
}

export const guideContents = modules;
