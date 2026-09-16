import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import { ToolPanelSkeleton } from '@/components/tool-shell/tool-panel-skeleton';

/**
 * Lazy map from `componentKey` to the interactive Client Component for a tool
 * (spec §7.1, §7.8).
 *
 * Each entry is its own dynamic import so the heavy image, PDF and document
 * libraries stay in route-scoped chunks and never leak into the shared bundle.
 * Adding a tool means adding one line here; `assertToolImplementations` fails
 * the production build while a registry entry has no implementation.
 */
export type ToolComponentProps = Record<string, never>;

const toolComponents: Record<string, ComponentType<ToolComponentProps>> = {
  // Phase 2 — calculators
  // Phase 3 — text and developer tools
  // Phase 4 — image tools
  // Phase 5 — PDF tools
  // Phase 6 — business document generators
};

/** Registered so `dynamic` and the skeleton are referenced even while the map is empty. */
export const loadingFallback = ToolPanelSkeleton;
export const dynamicImport = dynamic;

export function getToolComponent(componentKey: string): ComponentType<ToolComponentProps> | null {
  return toolComponents[componentKey] ?? null;
}

export function implementedComponentKeys(): string[] {
  return Object.keys(toolComponents);
}
