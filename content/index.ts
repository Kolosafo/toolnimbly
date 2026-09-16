import { ageCalculatorContent } from './tools/age-calculator';
import { bmiCalculatorContent } from './tools/bmi-calculator';
import { calorieCalculatorContent } from './tools/calorie-calculator';
import { caseConverterContent } from './tools/case-converter';
import { characterCounterContent } from './tools/character-counter';
import { compoundInterestCalculatorContent } from './tools/compound-interest-calculator';
import { dateDifferenceCalculatorContent } from './tools/date-difference-calculator';
import { imageCompressorContent } from './tools/image-compressor';
import { imageCropperContent } from './tools/image-cropper';
import { imageResizerContent } from './tools/image-resizer';
import { imageToPdfContent } from './tools/image-to-pdf';
import { invoiceGeneratorContent } from './tools/invoice-generator';
import { jpgCompressorContent } from './tools/jpg-compressor';
import { jpgToPdfContent } from './tools/jpg-to-pdf';
import { jpgToPngContent } from './tools/jpg-to-png';
import { loanCalculatorContent } from './tools/loan-calculator';
import { mortgageCalculatorContent } from './tools/mortgage-calculator';
import { passwordGeneratorContent } from './tools/password-generator';
import { pdfCompressorContent } from './tools/pdf-compressor';
import { pdfMergerContent } from './tools/pdf-merger';
import { pdfSplitterContent } from './tools/pdf-splitter';
import { pdfToJpgContent } from './tools/pdf-to-jpg';
import { percentageCalculatorContent } from './tools/percentage-calculator';
import { pngCompressorContent } from './tools/png-compressor';
import { pngToJpgContent } from './tools/png-to-jpg';
import { qrCodeGeneratorContent } from './tools/qr-code-generator';
import { receiptGeneratorContent } from './tools/receipt-generator';
import { salaryCalculatorContent } from './tools/salary-calculator';
import { uuidGeneratorContent } from './tools/uuid-generator';
import { wordCounterContent } from './tools/word-counter';
import type { ToolContent } from './types';

export type * from './types';

/**
 * Every reviewed content module, keyed by tool slug.
 *
 * Production cannot ship with a missing entry: `validateRegistry` fails when a
 * registry slug has no module here (spec §11, Phase 1 exit).
 */
export const toolContent: Readonly<Record<string, ToolContent>> = {
  'age-calculator': ageCalculatorContent,
  'bmi-calculator': bmiCalculatorContent,
  'calorie-calculator': calorieCalculatorContent,
  'case-converter': caseConverterContent,
  'character-counter': characterCounterContent,
  'compound-interest-calculator': compoundInterestCalculatorContent,
  'date-difference-calculator': dateDifferenceCalculatorContent,
  'image-compressor': imageCompressorContent,
  'image-cropper': imageCropperContent,
  'image-resizer': imageResizerContent,
  'image-to-pdf': imageToPdfContent,
  'invoice-generator': invoiceGeneratorContent,
  'jpg-compressor': jpgCompressorContent,
  'jpg-to-pdf': jpgToPdfContent,
  'jpg-to-png': jpgToPngContent,
  'loan-calculator': loanCalculatorContent,
  'mortgage-calculator': mortgageCalculatorContent,
  'password-generator': passwordGeneratorContent,
  'pdf-compressor': pdfCompressorContent,
  'pdf-merger': pdfMergerContent,
  'pdf-splitter': pdfSplitterContent,
  'pdf-to-jpg': pdfToJpgContent,
  'percentage-calculator': percentageCalculatorContent,
  'png-compressor': pngCompressorContent,
  'png-to-jpg': pngToJpgContent,
  'qr-code-generator': qrCodeGeneratorContent,
  'receipt-generator': receiptGeneratorContent,
  'salary-calculator': salaryCalculatorContent,
  'uuid-generator': uuidGeneratorContent,
  'word-counter': wordCounterContent,
};

export function findContent(slug: string): ToolContent | undefined {
  return toolContent[slug];
}

export function getContent(slug: string): ToolContent {
  const content = toolContent[slug];
  if (!content) throw new Error(`No content module for tool: ${slug}`);
  return content;
}
