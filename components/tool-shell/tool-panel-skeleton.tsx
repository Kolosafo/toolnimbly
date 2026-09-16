/**
 * Loading state for a lazily imported tool panel.
 *
 * It mirrors the real panel's shape so the surrounding layout does not shift
 * when the tool code arrives (spec §9, "Component states").
 */
export function ToolPanelSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-border-default bg-surface p-6"
    >
      <span className="sr-only">Loading the tool…</span>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-4 w-32 rounded bg-surface-sunken" />
        <div className="h-11 w-full rounded-md bg-surface-sunken" />
        <div className="h-4 w-24 rounded bg-surface-sunken" />
        <div className="h-11 w-full rounded-md bg-surface-sunken" />
        <div className="h-12 w-44 rounded-md bg-surface-sunken" />
      </div>
    </div>
  );
}
