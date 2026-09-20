import Link from 'next/link';

import type { ContentMethod, ContentSource } from '@/content/types';

export function FormulaBlock({
  method,
  sources,
}: {
  method: ContentMethod;
  sources?: readonly ContentSource[];
}) {
  return (
    <section aria-labelledby="method-heading">
      <h2 id="method-heading" className="text-xl font-semibold">
        {method.title}
      </h2>
      <p className="measure text-muted mt-3 text-sm">{method.body}</p>

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
          className="border-border-default bg-surface-sunken mt-4 w-full max-w-full overflow-x-auto rounded-lg border"
        >
          <pre className="min-w-0 p-4 font-mono text-sm leading-relaxed whitespace-pre">
            <code>{method.formulas.join('\n')}</code>
          </pre>
        </div>
      ) : null}

      {method.notes && method.notes.length > 0 ? (
        <ul className="measure mt-4 space-y-2">
          {method.notes.map((note) => (
            <li key={note} className="text-muted flex gap-2 text-sm">
              <span aria-hidden="true" className="bg-subtle mt-2 size-1 shrink-0 rounded-full" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="measure border-border-default bg-surface text-muted mt-5 rounded-lg border p-4 text-sm">
        <h3 className="text-foreground font-medium">Sources and methodology</h3>
        <p className="mt-2">
          {method.sourceNote ??
            'ToolNimbly performs this work locally in your browser using the method shown above.'}{' '}
          Read how{' '}
          <Link
            href="/about#how-the-calculations-are-tested"
            className="text-brand underline underline-offset-2 hover:no-underline"
          >
            ToolNimbly tests calculations and generated documents
          </Link>
          .
        </p>
        {sources && sources.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="text-brand underline underline-offset-2 hover:no-underline"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
