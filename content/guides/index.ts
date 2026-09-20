import { choosingAnImageFormat } from './choosing-an-image-format';
import { countingWordsAndCharacters } from './counting-words-and-characters';
import { choosingAStrongPassword } from './choosing-a-strong-password';
import { howLoanInterestWorks } from './how-loan-interest-works';
import { readingHealthCalculators } from './reading-health-calculators';
import type { GuideContent } from './types';
import { whatAnInvoiceMustContain } from './what-an-invoice-must-contain';
import { whyPdfsAreLarge } from './why-pdfs-are-large';

export type { GuideContent, GuideSection } from './types';

const modules: readonly GuideContent[] = [
  howLoanInterestWorks,
  choosingAStrongPassword,
  choosingAnImageFormat,
  whyPdfsAreLarge,
  whatAnInvoiceMustContain,
  countingWordsAndCharacters,
  readingHealthCalculators,
];

const bySlug = new Map(modules.map((guide) => [guide.slug, guide]));

export function findGuideContent(slug: string): GuideContent | undefined {
  return bySlug.get(slug);
}

export const guideContents = modules;
