/**
 * Where the research lives, and what has to be true before it is published.
 *
 * This module is route constants and a re-export. The gate itself —
 * `publicationBlockers`, `benchmarkGate`, `BENCHMARK_REVIEWED_ON` and
 * `FIELDWORK_RECORD` — lives in `pipeline.ts`, because
 * `scripts/research/publish-benchmark.mjs` has to run exactly the same check
 * before it writes anything into `public/`, and Node can only load that one
 * alias-free module. Re-exporting keeps a single definition: the route, the
 * sitemap, the tests and the publish command all ask the same function.
 */

export {
  BENCHMARK_REVIEWED_ON,
  FIELDWORK_RECORD,
  benchmarkGate,
  publicationBlockers,
  type BenchmarkGate,
  type BenchmarkGateInput,
  type BenchmarkVisibility,
  type FieldworkRecord,
} from '@/lib/research/pipeline';

/** The canonical path. One definition, used by the route, sitemap and tests. */
export const BENCHMARK_PATH = '/research/invoice-payment-terms-benchmark-2026';
export const RESEARCH_INDEX_PATH = '/research';
export const SURVEY_PATH = '/research/invoice-payment-terms-survey';

/** The public aggregate download, written by `pnpm research:build`. */
export const AGGREGATE_CSV_PATH = '/research/invoice-payment-terms-benchmark-2026-aggregates.csv';

export const BENCHMARK_TITLE = 'Invoice Payment Terms Benchmark 2026';
export const BENCHMARK_HEADING = '2026 Small Business Invoice Payment Terms Benchmark';
