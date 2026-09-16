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

  // Phase 4 — image tools
  // Phase 5 — PDF tools
  // Phase 6 — business document generators
};

export function getToolComponent(componentKey: string): ComponentType<ToolComponentProps> | null {
  return toolComponents[componentKey] ?? null;
}

export function implementedComponentKeys(): string[] {
  return Object.keys(toolComponents);
}
