import type { ContentMethod } from '@/content/types';

export function FormulaBlock({ method }: { method: ContentMethod }) {
  return (
    <section aria-labelledby="method-heading">
      <h2 id="method-heading" className="text-xl font-semibold">
        {method.title}
      </h2>
      <p className="measure mt-3 text-sm text-muted">{method.body}</p>

      {method.formulas && method.formulas.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border-default bg-surface-sunken">
          <pre className="p-4 font-mono text-sm leading-relaxed whitespace-pre">
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
