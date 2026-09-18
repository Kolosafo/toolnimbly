import type { ContentExample } from '@/content/types';

export function WorkedExample({ example }: { example: ContentExample }) {
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading" className="text-xl font-semibold">
        Worked example
      </h2>
      <div className="mt-4 rounded-lg border border-border-default bg-surface p-5">
        <h3 className="text-base font-medium">{example.title}</h3>
        <p className="measure mt-2 text-sm text-muted">{example.body}</p>

        {example.rows && example.rows.length > 0 ? (
          <dl className="mt-4 divide-y divide-[color:var(--border)] border-t border-border-default">
            {example.rows.map((row) => (
              <div key={row.label} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-2">
                <dt className="text-sm text-muted">{row.label}</dt>
                {/* Values include unbroken tokens — a UUID, a Wi-Fi payload.
                    `anywhere` rather than `break-word` because only `anywhere`
                    reduces the element's min-content width, which is what stops
                    Firefox widening the page to fit it. */}
                <dd className="tabular text-sm font-medium [overflow-wrap:anywhere]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {example.conclusion ? (
          <p className="measure mt-4 text-sm text-muted">{example.conclusion}</p>
        ) : null}
      </div>
    </section>
  );
}
