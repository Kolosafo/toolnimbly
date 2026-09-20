import 'server-only';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { features } from '@/lib/config/features';
import { isProduction } from '@/lib/config/site';
import { parseBenchmarkSummary, type BenchmarkSummary } from '@/lib/research/pipeline';
import { benchmarkGate, type BenchmarkGate } from '@/lib/research/publication';

/**
 * Loads the benchmark's aggregate summary for the report route.
 *
 * `server-only`, and reading from `data/` rather than `public/`, is the control
 * that keeps response-level data off the wire: the only file this module can
 * read is the aggregate summary, it is parsed by a strict schema that rejects
 * any unexpected key, and the route renders from the parsed object. A raw
 * export has no path into a page payload even by accident.
 *
 * The read happens once, at build time — the route is statically generated —
 * so a missing file yields a real 404 in the built output rather than a
 * runtime error.
 */

const SUMMARY_PATH = join(
  process.cwd(),
  'data',
  'research',
  'aggregates',
  'invoice-payment-terms-benchmark-2026-summary.json',
);

let cached: { readonly summary: BenchmarkSummary | null } | null = null;

export function loadBenchmarkSummary(): BenchmarkSummary | null {
  if (cached) return cached.summary;

  let raw: string;
  try {
    raw = readFileSync(SUMMARY_PATH, 'utf8');
  } catch {
    // Expected until the owner supplies a validated export. Not an error.
    cached = { summary: null };
    return null;
  }

  try {
    const summary = parseBenchmarkSummary(JSON.parse(raw));
    cached = { summary };
    return summary;
  } catch (error) {
    /*
     * A summary that exists but does not match the contract is a real problem —
     * a stale file, a hand-edit, or a pipeline change without a rebuild. It
     * must not be rendered, and it must not pass silently either.
     */
    console.error('[research] the benchmark summary failed contract validation:', error);
    cached = { summary: null };
    return null;
  }
}

export function benchmarkPublicationGate(): BenchmarkGate {
  return benchmarkGate({
    summary: loadBenchmarkSummary(),
    approved: features.researchBenchmarkPublished,
    isProduction,
  });
}

/** True when the report may appear in the sitemap and in site navigation. */
export function benchmarkIsPublished(): boolean {
  return benchmarkPublicationGate().visibility === 'published';
}
