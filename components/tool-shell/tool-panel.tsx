import { TriangleAlert } from 'lucide-react';

import { getToolComponent } from '@/components/tools/tool-components';
import { isProduction } from '@/lib/config/site';
import type { ToolDefinition } from '@/lib/registry/types';

/**
 * Renders the interactive panel for a tool.
 *
 * While a tool is not yet implemented, development shows a clearly marked
 * placeholder and a production build throws — which fails `next build`, because
 * every tool route is statically generated. That is the mechanism enforcing the
 * Phase 1 exit rule that placeholders must never be deployable (spec §11).
 */
export function ToolPanel({ tool }: { tool: ToolDefinition }) {
  const Component = getToolComponent(tool.componentKey);

  if (Component) {
    // `getToolComponent` is a lookup into a module-scope map of statically
    // imported components, not a factory — nothing is constructed per render,
    // so the state-reset hazard the rule guards against cannot occur here.
    // eslint-disable-next-line react-hooks/static-components
    return <Component />;
  }

  if (isProduction) {
    throw new Error(
      `Tool "${tool.slug}" has no interactive implementation registered for componentKey ` +
        `"${tool.componentKey}". A production build must not ship a placeholder panel. ` +
        `Either implement the tool or remove it from the registry.`,
    );
  }

  return <DevelopmentPlaceholder tool={tool} />;
}

function DevelopmentPlaceholder({ tool }: { tool: ToolDefinition }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-warning-border bg-warning-surface p-6">
      <p className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden="true" />
        Development placeholder — not deployable
      </p>
      <p className="measure mt-3 text-sm">
        The interactive panel for the {tool.name} has not been implemented yet. The surrounding page,
        its metadata, its editorial content and its internal links are complete and testable; only
        this panel is outstanding.
      </p>
      <p className="mt-3 font-mono text-xs text-muted">componentKey: {tool.componentKey}</p>
      <p className="measure mt-3 text-sm text-muted">
        A production build fails while this placeholder is present, so it cannot reach users.
      </p>
    </div>
  );
}
