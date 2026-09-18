import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import { ToolPanelSkeleton } from '@/components/tool-shell/tool-panel-skeleton';

/**
 * Lazy map from `componentKey` to the interactive Client Component for a tool
 * (spec §7.1, §7.8).
 *
 * Each entry is its own dynamic import so the heavy image, PDF and document
 * libraries stay in route-scoped chunks and never leak into the shared bundle.
 * Adding a tool means adding one line here; the production build fails while a
 * registry entry has no implementation.
 */
export type ToolComponentProps = Record<string, never>;

const loading = () => <ToolPanelSkeleton />;

const toolComponents: Record<string, ComponentType<ToolComponentProps>> = {
  // --- Phase 2: calculators ------------------------------------------------
  'percentage-calculator': dynamic(
    () =>
      import('@/components/tools/calculators/percentage-calculator').then(
        (m) => m.PercentageCalculator,
      ),
    { loading },
  ),
  'loan-calculator': dynamic(
    () => import('@/components/tools/calculators/loan-calculator').then((m) => m.LoanCalculator),
    { loading },
  ),
  'mortgage-calculator': dynamic(
    () =>
      import('@/components/tools/calculators/mortgage-calculator').then((m) => m.MortgageCalculator),
    { loading },
  ),
  'compound-interest-calculator': dynamic(
    () =>
      import('@/components/tools/calculators/compound-interest-calculator').then(
        (m) => m.CompoundInterestCalculator,
      ),
    { loading },
  ),
  'salary-calculator': dynamic(
    () => import('@/components/tools/calculators/salary-calculator').then((m) => m.SalaryCalculator),
    { loading },
  ),
  'age-calculator': dynamic(
    () => import('@/components/tools/calculators/age-calculator').then((m) => m.AgeCalculator),
    { loading },
  ),
  'date-difference-calculator': dynamic(
    () =>
      import('@/components/tools/calculators/date-difference-calculator').then(
        (m) => m.DateDifferenceCalculator,
      ),
    { loading },
  ),
  'bmi-calculator': dynamic(
    () => import('@/components/tools/calculators/bmi-calculator').then((m) => m.BmiCalculator),
    { loading },
  ),
  'calorie-calculator': dynamic(
    () =>
      import('@/components/tools/calculators/calorie-calculator').then((m) => m.CalorieCalculator),
    { loading },
  ),

  // --- Phase 3: text and developer tools -----------------------------------
  'qr-code-generator': dynamic(
    () => import('@/components/tools/text/qr-code-generator').then((m) => m.QrCodeGenerator),
    { loading },
  ),
  'password-generator': dynamic(
    () => import('@/components/tools/text/password-generator').then((m) => m.PasswordGenerator),
    { loading },
  ),
  'uuid-generator': dynamic(
    () => import('@/components/tools/text/uuid-generator').then((m) => m.UuidGenerator),
    { loading },
  ),
  'word-counter': dynamic(
    () => import('@/components/tools/text/word-counter').then((m) => m.WordCounter),
    { loading },
  ),
  'character-counter': dynamic(
    () => import('@/components/tools/text/character-counter').then((m) => m.CharacterCounter),
    { loading },
  ),
  'case-converter': dynamic(
    () => import('@/components/tools/text/case-converter').then((m) => m.CaseConverter),
    { loading },
  ),

  // --- Phase 4: image tools ------------------------------------------------
  'image-compressor': dynamic(
    () => import('@/components/tools/images/batch-tools').then((m) => m.ImageCompressor),
    { loading },
  ),
  'jpg-compressor': dynamic(
    () => import('@/components/tools/images/batch-tools').then((m) => m.JpgCompressor),
    { loading },
  ),
  'png-compressor': dynamic(
    () => import('@/components/tools/images/batch-tools').then((m) => m.PngCompressor),
    { loading },
  ),
  'jpg-to-png': dynamic(
    () => import('@/components/tools/images/batch-tools').then((m) => m.JpgToPng),
    { loading },
  ),
  'png-to-jpg': dynamic(
    () => import('@/components/tools/images/batch-tools').then((m) => m.PngToJpg),
    { loading },
  ),
  'image-resizer': dynamic(
    () => import('@/components/tools/images/image-resizer').then((m) => m.ImageResizer),
    { loading },
  ),
  'image-cropper': dynamic(
    () => import('@/components/tools/images/image-cropper').then((m) => m.ImageCropper),
    { loading },
  ),

  // --- Phase 5: PDF tools --------------------------------------------------
  'image-to-pdf': dynamic(
    () => import('@/components/tools/pdf/image-to-pdf').then((m) => m.ImageToPdf),
    { loading },
  ),
  'jpg-to-pdf': dynamic(
    () => import('@/components/tools/pdf/image-to-pdf').then((m) => m.JpgToPdf),
    { loading },
  ),
  'pdf-to-jpg': dynamic(
    () => import('@/components/tools/pdf/pdf-to-jpg').then((m) => m.PdfToJpg),
    { loading },
  ),
  'pdf-compressor': dynamic(
    () => import('@/components/tools/pdf/pdf-compressor').then((m) => m.PdfCompressor),
    { loading },
  ),
  'pdf-merger': dynamic(
    () => import('@/components/tools/pdf/pdf-merger').then((m) => m.PdfMerger),
    { loading },
  ),
  'pdf-splitter': dynamic(
    () => import('@/components/tools/pdf/pdf-splitter').then((m) => m.PdfSplitter),
    { loading },
  ),

  // --- Phase 6: business document generators -------------------------------
  'invoice-generator': dynamic(
    () => import('@/components/tools/business/generators').then((m) => m.InvoiceGenerator),
    { loading },
  ),
  'receipt-generator': dynamic(
    () => import('@/components/tools/business/generators').then((m) => m.ReceiptGenerator),
    { loading },
  ),
};

export function getToolComponent(componentKey: string): ComponentType<ToolComponentProps> | null {
  return toolComponents[componentKey] ?? null;
}

export function implementedComponentKeys(): string[] {
  return Object.keys(toolComponents);
}
