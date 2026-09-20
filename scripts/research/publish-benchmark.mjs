/**
 * Publish the aggregate CSV — regenerated from the validated summary.
 *
 *   pnpm research:publish                  # publish, or say exactly why it refused
 *   pnpm research:publish --check          # report the gate and any drift, write nothing
 *   pnpm research:publish --root <dir>     # run against a fixture directory, for verification
 *
 * This is the only thing in the repository that puts a research file where the
 * web can reach it, and it is separate from `pnpm research:build` on purpose.
 * Producing aggregates is an analysis step; serving them is a publication
 * decision, and a URL that resolves before the report does can be crawled,
 * cached and cited while the page itself still returns 404.
 *
 * It does not copy the stored CSV. The summary is the artefact that passed
 * validation — strict schema, arithmetic audit, disclosure check — and the CSV
 * beside it is just a rendering of the same figures that nothing re-checks. A
 * file edited by hand, merged badly or contaminated with response-level rows
 * would be copied straight to a public URL. So the published bytes are derived
 * here from the validated summary with `aggregateCsvRows`, and the stored copy
 * is rewritten from the same source, which corrects any drift rather than
 * leaving the repository holding two files that disagree.
 *
 * It runs the same `publicationBlockers` the route and the sitemap run, so
 * those three cannot disagree. If the gate is shut it also removes any CSV a
 * previous run left in `public/`, because a stale published file is the exact
 * failure this script exists to prevent.
 *
 * The pipeline is imported with an explicit `.ts` specifier so Node can
 * type-strip it; see ADR 0010 for why it is one alias-free module.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { toCsv } from '../../lib/download/csv.ts';
import {
  AGGREGATE_CSV_COLUMNS,
  aggregateCsvRows,
  parseBenchmarkSummary,
  publicationBlockers,
} from '../../lib/research/pipeline.ts';

const AGGREGATE_DIR = 'data/research/aggregates';
const PUBLIC_DIR = 'public/research';
const SUMMARY_FILE = 'invoice-payment-terms-benchmark-2026-summary.json';
const CSV_FILE = 'invoice-payment-terms-benchmark-2026-aggregates.csv';

const { values } = parseArgs({
  options: {
    check: { type: 'boolean', default: false },
    root: { type: 'string' },
  },
});

const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
  values.root ? resolve(values.root) : '.',
);

const storedCsv = join(projectRoot, AGGREGATE_DIR, CSV_FILE);
const publicCsv = join(projectRoot, PUBLIC_DIR, CSV_FILE);

/** Read the summary if one exists. A missing file is a blocker, not a crash. */
function loadSummary() {
  const path = join(projectRoot, AGGREGATE_DIR, SUMMARY_FILE);
  if (!existsSync(path)) return null;
  try {
    return parseBenchmarkSummary(JSON.parse(readFileSync(path, 'utf8')));
  } catch (error) {
    console.error(`The summary at ${AGGREGATE_DIR}/${SUMMARY_FILE} did not pass validation:`);
    console.error(String(error instanceof Error ? error.message : error));
    console.error('');
    console.error('Re-run `pnpm research:build` against the real export.');
    process.exit(1);
  }
}

/** The CSV the validated summary implies. The only bytes ever published. */
function renderCsv(summary) {
  return toCsv(
    aggregateCsvRows(summary),
    AGGREGATE_CSV_COLUMNS.map((column) => ({
      header: column.header,
      value: (row) => row[column.key],
    })),
  );
}

const summary = loadSummary();
const approved = ['true', '1'].includes(process.env.NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED ?? '');
const blockers = publicationBlockers({ summary, approved, isProduction: true });
const derived = summary === null ? null : renderCsv(summary);

/*
 * Drift is reported whether or not the gate is open, because it is worth
 * knowing either way: the stored CSV disagreeing with the summary means
 * something edited one of them.
 */
const drifted =
  derived !== null && existsSync(storedCsv) && readFileSync(storedCsv, 'utf8') !== derived;

console.log('');

if (drifted) {
  console.warn(
    `${AGGREGATE_DIR}/${CSV_FILE} does not match the validated summary. It was edited, or `,
  );
  console.warn('written by an older build. The summary is authoritative and the published file');
  console.warn(
    values.check
      ? 'would be regenerated from it.'
      : 'is regenerated from it; the stored copy is rewritten to match.',
  );
  console.warn('');
}

if (blockers.length > 0) {
  console.error('The benchmark may not publish. Outstanding:');
  for (const blocker of blockers) console.error(`  - ${blocker}`);
  console.error('');

  if (existsSync(publicCsv)) {
    if (values.check) {
      console.error(`A published CSV is present at ${PUBLIC_DIR}/${CSV_FILE} and should not be.`);
      console.error('Run `pnpm research:publish` without --check to remove it.');
    } else {
      rmSync(publicCsv);
      console.error(`Removed ${PUBLIC_DIR}/${CSV_FILE}, which the gate does not permit.`);
    }
  } else {
    console.error('Nothing is published. No file was written.');
  }

  process.exit(1);
}

if (values.check) {
  console.log('The gate is open. Run without --check to publish the aggregate CSV.');
  process.exit(0);
}

mkdirSync(join(projectRoot, PUBLIC_DIR), { recursive: true });
// Both copies come from the summary, so the repository cannot end up holding
// two files that disagree about what the research found.
writeFileSync(storedCsv, derived, 'utf8');
writeFileSync(publicCsv, derived, 'utf8');

console.log(`Published ${PUBLIC_DIR}/${CSV_FILE}, regenerated from the validated summary.`);
console.log('');
console.log(`Valid responses: ${summary.totalValidResponses}`);
console.log(`Fieldwork:       ${summary.fieldwork.start} to ${summary.fieldwork.end}`);
console.log('');
console.log('Aggregates only. No individual response is in this file or anywhere else that is');
console.log('served. Commit the published CSV alongside the summary so the deployed build has');
console.log('the same figures the report renders.');
