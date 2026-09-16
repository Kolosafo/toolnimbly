/**
 * CSV generation for the calculator schedule exports (spec §6.2–§6.4).
 */

export type CsvColumn<Row> = {
  header: string;
  /** Returns a raw value; formatting for CSV happens here, not in the UI. */
  value: (row: Row) => string | number | null | undefined;
};

/**
 * Escapes a single CSV field.
 *
 * A field is quoted when it contains a delimiter, a quote or a line break, and
 * embedded quotes are doubled, per RFC 4180. A leading `=`, `+`, `-` or `@` is
 * prefixed with an apostrophe so spreadsheet software does not interpret the
 * value as a formula.
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';

  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv<Row>(rows: readonly Row[], columns: readonly CsvColumn<Row>[]): string {
  const header = columns.map((column) => escapeCsvField(column.header)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvField(column.value(row))).join(','),
  );
  // A trailing newline is conventional and keeps POSIX tools happy.
  return [header, ...body].join('\r\n') + '\r\n';
}
