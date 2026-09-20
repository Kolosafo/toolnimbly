/**
 * Validate a private survey export and, optionally, write the aggregates.
 *
 *   pnpm research:validate            # validate only
 *   pnpm research:build               # validate, then write aggregate outputs
 *   pnpm research:validate --input path/to/export.csv
 *
 * Everything this writes stays under `data/research/aggregates/`, which is not
 * served. Nothing here can make a file reachable from the web: copying the CSV
 * into `public/` is `pnpm research:publish`, which runs the full publication
 * gate first. Generating aggregates is not the same decision as publishing
 * them, and this script deliberately cannot make the second one.
 *
 * The default input is `data/research/private/invoice-payment-terms-responses.private.csv`,
 * which `.gitignore` excludes. The raw export must never be committed.
 *
 * What this prints: totals, rejection reasons by column, and blank-value counts.
 * What it never prints: a response row, a cell value, or a response ID — not
 * even for a rejected row, because a value that fails validation is exactly the
 * value most likely to contain something a participant should not have typed.
 *
 * The pipeline is imported with an explicit `.ts` specifier so Node can
 * type-strip it; see ADR 0010 for why it is one alias-free module.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { toCsv } from '../../lib/download/csv.ts';
import {
  AGGREGATE_CSV_COLUMNS,
  aggregate,
  aggregateCsvRows,
  formatValidationReport,
  MINIMUM_VALID_RESPONSES,
  parseBenchmarkSummary,
  parseCsv,
  PREFERRED_VALID_RESPONSES,
  validateResponses,
} from '../../lib/research/pipeline.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const DEFAULT_INPUT = 'data/research/private/invoice-payment-terms-responses.private.csv';
const AGGREGATE_DIR = 'data/research/aggregates';
const SUMMARY_FILE = 'invoice-payment-terms-benchmark-2026-summary.json';
const CSV_FILE = 'invoice-payment-terms-benchmark-2026-aggregates.csv';

const { values } = parseArgs({
  options: {
    input: { type: 'string' },
    write: { type: 'boolean', default: false },
  },
});

const inputPath = resolve(projectRoot, values.input ?? DEFAULT_INPUT);

let raw;
try {
  raw = readFileSync(inputPath, 'utf8');
} catch {
  console.error(`No export found at ${inputPath}`);
  console.error('');
  console.error('This is the expected state until the owner supplies a real anonymized export.');
  console.error('See docs/research/data-handling.md §7 for the five conditions that gate');
  console.error('publication, and §4 for how to run this command once an export exists.');
  process.exit(2);
}

const { report, responses } = validateResponses(parseCsv(raw));

console.log('');
console.log(formatValidationReport(report));
console.log('');

if (report.fatalErrors.length > 0) {
  console.error('The export does not satisfy the data contract. Nothing was written.');
  process.exit(1);
}

if (!values.write) {
  console.log('Validation only. Re-run with `pnpm research:build` to write the aggregates.');
  process.exit(report.meetsMinimumSample ? 0 : 1);
}

if (!report.meetsMinimumSample) {
  console.error(
    `Only ${report.validRows} valid responses. The publication floor is ` +
      `${MINIMUM_VALID_RESPONSES} (${PREFERRED_VALID_RESPONSES}+ preferred). Nothing was written.`,
  );
  process.exit(1);
}

const summary = parseBenchmarkSummary(JSON.parse(JSON.stringify(aggregate(responses))));

if (summary.fieldwork.start === null || summary.fieldwork.end === null) {
  console.error(
    'The export carries no usable `submitted_at` column, so fieldwork dates cannot be stated.',
  );
  console.error('The report requires them. Nothing was written.');
  process.exit(1);
}

const csv = toCsv(
  aggregateCsvRows(summary),
  AGGREGATE_CSV_COLUMNS.map((column) => ({
    header: column.header,
    value: (row) => row[column.key],
  })),
);

mkdirSync(join(projectRoot, AGGREGATE_DIR), { recursive: true });

writeFileSync(
  join(projectRoot, AGGREGATE_DIR, SUMMARY_FILE),
  `${JSON.stringify(summary, null, 2)}\n`,
  'utf8',
);
writeFileSync(join(projectRoot, AGGREGATE_DIR, CSV_FILE), csv, 'utf8');

const suppressedCells = summary.crossTabs.reduce((total, tab) => total + tab.suppressedCells, 0);
const suppressedSegments = summary.crossTabs.reduce(
  (total, tab) => total + tab.suppressedSegments,
  0,
);

console.log('Wrote:');
console.log(`  ${AGGREGATE_DIR}/${SUMMARY_FILE}`);
console.log(`  ${AGGREGATE_DIR}/${CSV_FILE}`);
console.log('');
console.log(`Valid responses: ${summary.totalValidResponses}`);
console.log(`Fieldwork:       ${summary.fieldwork.start} to ${summary.fieldwork.end}`);
console.log(`Suppressed:      ${suppressedSegments} segments, ${suppressedCells} cells`);
console.log('');
console.log('These are aggregates only. The raw export stays out of Git, and nothing here is');
console.log('reachable from the web: neither file is served, and the report still returns a');
console.log('404 in production.');
console.log('');
console.log('To publish, run `pnpm research:publish`. It refuses unless the editorial review');
console.log('date is recorded in lib/research/pipeline.ts and');
console.log('NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED=true, which the owner sets only after');
console.log('approving the findings, wording, methodology, limitations and date in writing.');
