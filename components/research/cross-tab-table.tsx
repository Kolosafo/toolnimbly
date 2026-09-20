import type { CrossTab } from '@/lib/research/pipeline';

/**
 * A segment comparison, as a table and nothing else.
 *
 * There is no chart here on purpose. A cross-tabulation with withheld cells
 * cannot be drawn honestly — a missing bar reads as zero — so the comparison is
 * presented as figures, with every withheld cell marked in words rather than by
 * absence.
 *
 * Segments whose every cell is withheld are dropped from the table entirely and
 * accounted for in the note below it, which is what "safe segment comparisons
 * where every displayed group passes suppression" means in practice.
 */
export function CrossTabTable({ crossTab }: { crossTab: CrossTab }) {
  const visibleSegments = crossTab.segments.filter(
    (segment) => !segment.suppressed && segment.cells.some((cell) => !cell.suppressed),
  );

  const measureOptions = crossTab.segments[0]?.cells ?? [];
  const withheldSegments = crossTab.segments.length - visibleSegments.length;
  const withheldCells = visibleSegments.reduce(
    (total, segment) => total + segment.cells.filter((cell) => cell.suppressed).length,
    0,
  );

  if (visibleSegments.length === 0) {
    return (
      <p className="text-muted mt-4 text-sm">
        Every group in this comparison falls below the reporting threshold, so none of it is
        published. The underlying counts exist but are too small to show without risking
        identification.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div
        tabIndex={0}
        role="region"
        aria-label={crossTab.title}
        className="border-border-default w-full max-w-full overflow-x-auto rounded-lg border"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="text-muted px-3 py-2 text-left text-xs">
            {crossTab.title}. Each row is a group; percentages are of that group&rsquo;s own
            respondents, shown in the &ldquo;Group size&rdquo; column.
          </caption>
          <thead className="bg-surface-sunken">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left font-medium">
                Group
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                Group size
              </th>
              {measureOptions.map((option) => (
                <th
                  key={option.value}
                  scope="col"
                  className="px-3 py-2.5 text-right font-medium whitespace-nowrap"
                >
                  {option.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {visibleSegments.map((segment) => (
              <tr key={segment.value} className="bg-surface">
                <th scope="row" className="px-3 py-2 text-left font-normal">
                  {segment.label}
                </th>
                <td className="tabular px-3 py-2 text-right">{segment.base}</td>
                {segment.cells.map((cell) => (
                  <td key={cell.value} className="tabular px-3 py-2 text-right">
                    {cell.suppressed ? (
                      <span className="text-muted text-xs">withheld</span>
                    ) : (
                      <>
                        {cell.percent?.toFixed(1)}%{' '}
                        <span className="text-muted">({cell.count})</span>
                      </>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-muted mt-2 text-xs">
        {withheldCells > 0 || withheldSegments > 0
          ? `${withheldCells} cell${withheldCells === 1 ? '' : 's'} and ${withheldSegments} group${
              withheldSegments === 1 ? '' : 's'
            } are withheld because they represent too few respondents. `
          : ''}
        A difference between two groups here is an association in this sample, not evidence that one
        causes the other.
      </p>
    </div>
  );
}
