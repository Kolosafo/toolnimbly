/**
 * Skip link (spec §5.5). Visually hidden until focused, then it appears as a
 * real control at the top of the page.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only-focusable absolute top-2 left-2 z-50 rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-contrast shadow-lg"
    >
      Skip to main content
    </a>
  );
}
