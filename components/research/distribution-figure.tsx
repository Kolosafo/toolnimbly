import type { Distribution } from '@/lib/research/pipeline';

/**
 * One survey question, drawn as a horizontal bar chart with the same numbers
 * repeated in a real table underneath.
 *
 * The bars are plain `div`s sized by a percentage width, rendered on the
 * server. There is no canvas, no chart library and no client JavaScript, so
 * the figure survives a failed script, a blocked bundle and a text-only
 * reader. They are also `aria-hidden`, following the same reasoning as
 * `components/charts/growth-chart.tsx`: a screen reader cannot usefully
 * consume a bar, and the table below is the accessible equivalent rather than
 * a fallback.
 *
 * Colour carries no meaning here. Every bar is the same brand colour, and the
 * category is identified by its text label in both the chart and the table, so
 * there is nothing for a colour-blind reader to miss and no legend to read.
 *
 * Nothing animates, and every bar's width is known at render time, so the
 * figure cannot shift the page after paint.
 */
export function DistributionFigure({
  distribution,
  headingId,
}: {
  distribution: Distribution;
  headingId: string;
}) {
  const { rows, base, question } = distribution;
  const largest = Math.max(...rows.map((row) => row.percent), 1);
  const hasNonSubstantive = rows.some((row) => row.nonSubstantive);

  return (
    <figure className="mt-5" aria-labelledby={headingId}>
      <figcaption className="sr-only">
        {question} Share of all {base} valid responses, in percent.
      </figcaption>

      <div aria-hidden="true" className="space-y-3">
        {rows.map((row) => (
          <div key={row.value} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm">
                {row.label}
                {row.nonSubstantive ? <span className="text-subtle"> †</span> : null}
              </span>
              <span className="tabular text-sm font-medium whitespace-nowrap">
                {row.percent.toFixed(1)}% <span className="text-muted">({row.count})</span>
              </span>
            </div>
            <div className="border-border-default bg-surface-sunken h-2.5 overflow-hidden rounded-full border">
              <div
                className="bg-brand h-full rounded-full"
                style={{ width: `${(row.percent / largest) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-label={`${question} Full figures.`}
        className="border-border-default mt-5 w-full max-w-full overflow-x-auto rounded-lg border"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="text-muted px-3 py-2 text-left text-xs">
            {question} Base: all {base} valid responses. Percentages of {base}.
          </caption>
          <thead className="bg-surface-sunken">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left font-medium">
                Answer
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                Respondents
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                Share of {base}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {rows.map((row) => (
              <tr key={row.value} className="bg-surface">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  {row.label}
                  {row.nonSubstantive ? <span className="text-subtle"> †</span> : null}
                </th>
                <td className="tabular px-3 py-2 text-right">{row.count}</td>
                <td className="tabular px-3 py-2 text-right">{row.percent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasNonSubstantive && distribution.denominatorNote ? (
        <p className="text-muted mt-2 text-xs">† {distribution.denominatorNote}</p>
      ) : null}
    </figure>
  );
}
