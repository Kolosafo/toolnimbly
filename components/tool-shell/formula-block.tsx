import type { ContentMethod } from '@/content/types';

export function FormulaBlock({ method }: { method: ContentMethod }) {
  return (
    <section aria-labelledby="method-heading">
      <h2 id="method-heading" className="text-xl font-semibold">
        {method.title}
      </h2>
      <p className="measure mt-3 text-sm text-muted">{method.body}</p>

      {/* The scroll container carries tabIndex so it can be scrolled by
          keyboard when the formulas are wider than the viewport, which they are
          on a phone. w-full gives it a definite width: without that WebKit
          sizes it to the <pre>'s content, because `min-width: 0` does not
          shrink a block with `white-space: pre` there, and the page widens. */}
      {method.formulas && method.formulas.length > 0 ? (
        <div
          tabIndex={0}
          role="region"
          aria-label={`${method.title} formulas`}
          className="mt-4 w-full max-w-full overflow-x-auto rounded-lg border border-border-default bg-surface-sunken"
        >
          <pre className="min-w-0 p-4 font-mono text-sm leading-relaxed whitespace-pre">
            <code>{method.formulas.join('\n')}</code>
          </pre>
        </div>
      ) : null}

      {method.notes && method.notes.length > 0 ? (
        <ul className="measure mt-4 space-y-2">
          {method.notes.map((note) => (
            <li key={note} className="flex gap-2 text-sm text-muted">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-subtle" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
