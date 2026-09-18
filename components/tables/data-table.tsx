'use client';

import { Download } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { toCsv, type CsvColumn } from '@/lib/download/csv';
import { downloadText } from '@/lib/download/file';

export type TableColumn<Row> = {
  header: string;
  /** Rendered cell content. */
  cell: (row: Row) => ReactNode;
  /** Right-aligned for numeric columns. */
  numeric?: boolean;
};

/**
 * A scrollable data table with an optional CSV export (spec §5.4, §6.2).
 *
 * The table scrolls inside its own container rather than overflowing the page,
 * and long tables collapse to a first page with a control to reveal the rest so
 * a 360-row amortisation schedule does not cost a second of rendering.
 */
export function DataTable<Row>({
  caption,
  columns,
  rows,
  csvColumns,
  csvFilename,
  initialRowLimit = 24,
  rowKey,
}: {
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  csvColumns?: readonly CsvColumn<Row>[];
  csvFilename?: string;
  initialRowLimit?: number;
  rowKey: (row: Row, index: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleRows = expanded ? rows : rows.slice(0, initialRowLimit);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </p>
        {csvColumns && csvFilename ? (
          <button
            type="button"
            onClick={() => downloadText(toCsv(rows, csvColumns), csvFilename, 'csv')}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium transition-colors hover:bg-surface-sunken"
          >
            <Download className="size-4" aria-hidden="true" />
            Download CSV
          </button>
        ) : null}
      </div>

      {/* Keyboard-scrollable: on a narrow screen this is the only way to reach
          the columns that are off-screen. */}
      <div
        tabIndex={0}
        role="region"
        aria-label={caption}
        className="mt-3 w-full max-w-full overflow-x-auto rounded-lg border border-border-default"
      >
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface-sunken">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={`px-3 py-2.5 font-medium whitespace-nowrap ${
                    column.numeric ? 'text-right' : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {visibleRows.map((row, index) => (
              <tr key={rowKey(row, index)} className="bg-surface">
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={`px-3 py-2 whitespace-nowrap ${
                      column.numeric ? 'tabular text-right' : 'text-left'
                    }`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium transition-colors hover:bg-surface-sunken"
        >
          Show all {rows.length} rows
        </button>
      ) : null}
    </div>
  );
}
