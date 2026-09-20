import type { BenchmarkSummary, Distribution, DistributionRow } from '@/lib/research/pipeline';
import { roundPercent } from '@/lib/research/pipeline';

/**
 * The report's headline findings, derived from the summary rather than written.
 *
 * Every sentence here is assembled from counts the aggregator produced, so a
 * finding cannot say something the data does not. That is the point: a
 * hand-written summary is exactly where an unsupported claim gets in, and this
 * report has no room for one.
 *
 * The rules the wording follows:
 * - a denominator in every sentence;
 * - grouped shares only ever add documented buckets together, never interpolate
 *   inside one;
 * - "Not sure" is stated where it is large enough to change how a share reads;
 * - no causal verb, no trend claim, and no comparison to any population the
 *   survey did not measure.
 */

export type KeyFinding = {
  readonly id: string;
  readonly text: string;
};

function distribution(summary: BenchmarkSummary, field: string): Distribution | undefined {
  return summary.distributions.find((entry) => entry.field === field);
}

function row(source: Distribution | undefined, value: string): DistributionRow | undefined {
  return source?.rows.find((entry) => entry.value === value);
}

/** Combined count across several documented buckets of one question. */
function combined(source: Distribution | undefined, values: readonly string[]): number {
  if (!source) return 0;
  return source.rows
    .filter((entry) => values.includes(entry.value))
    .reduce((total, entry) => total + entry.count, 0);
}

function largestSubstantive(source: Distribution | undefined): DistributionRow | undefined {
  if (!source) return undefined;
  return [...source.rows]
    .filter((entry) => !entry.nonSubstantive)
    .sort((a, b) => b.count - a.count)[0];
}

export function keyFindings(summary: BenchmarkSummary): KeyFinding[] {
  const base = summary.totalValidResponses;
  if (base === 0) return [];

  const findings: KeyFinding[] = [];

  const terms = distribution(summary, 'usual_payment_terms');
  const topTerm = largestSubstantive(terms);
  if (topTerm && topTerm.count > 0) {
    findings.push({
      id: 'most-common-terms',
      text:
        `The most frequently chosen payment term was “${topTerm.label}”, given by ` +
        `${topTerm.count} of ${base} respondents (${topTerm.percent.toFixed(1)}%).`,
    });
  }

  const timing = distribution(summary, 'usual_days_to_payment');
  const within30 = combined(timing, ['0_7', '8_14', '15_30']);
  const after30 = combined(timing, ['31_45', '46_60', 'more_than_60']);
  const timingNotSure = row(timing, 'not_sure')?.count ?? 0;
  if (within30 + after30 > 0) {
    findings.push({
      id: 'payment-timing',
      text:
        `${within30} of ${base} respondents (${roundPercent(within30, base).toFixed(1)}%) said ` +
        'they are usually paid within 30 days of the invoice date, and ' +
        `${after30} (${roundPercent(after30, base).toFixed(1)}%) said they usually wait longer. ` +
        `${timingNotSure} answered “Not sure”. These are the ranges respondents selected, not ` +
        'measured payment dates.',
    });
  }

  const lateness = distribution(summary, 'late_payment_frequency');
  const quarterOrMore = combined(lateness, ['about_a_quarter', 'about_half', 'more_than_half']);
  const latenessNotSure = row(lateness, 'not_sure')?.count ?? 0;
  if (quarterOrMore > 0) {
    findings.push({
      id: 'late-payment',
      text:
        `${quarterOrMore} of ${base} respondents ` +
        `(${roundPercent(quarterOrMore, base).toFixed(1)}%) reported that at least a quarter of ` +
        `their invoices are paid after the due date. ${latenessNotSure} answered “Not sure”.`,
    });
  }

  const lateFees = distribution(summary, 'late_fee_policy');
  const noStatedFee = row(lateFees, 'do_not_state');
  const statedRarelyEnforced = row(lateFees, 'state_rarely_enforce');
  if (noStatedFee && statedRarelyEnforced) {
    const unenforced = noStatedFee.count + statedRarelyEnforced.count;
    findings.push({
      id: 'late-fees',
      text:
        `${unenforced} of ${base} respondents ` +
        `(${roundPercent(unenforced, base).toFixed(1)}%) either do not state a late fee at all ` +
        `(${noStatedFee.count}) or state one they rarely enforce ` +
        `(${statedRarelyEnforced.count}).`,
    });
  }

  const deposits = distribution(summary, 'deposit_policy');
  const anyDeposit = combined(deposits, ['always', 'sometimes']);
  if (anyDeposit > 0) {
    findings.push({
      id: 'deposits',
      text:
        `${anyDeposit} of ${base} respondents ` +
        `(${roundPercent(anyDeposit, base).toFixed(1)}%) said they always or sometimes ask for a ` +
        'deposit before starting work.',
    });
  }

  // Three to five. Anything beyond the fifth belongs in the sections below.
  return findings.slice(0, 5);
}

/**
 * The page's meta description, assembled from the data rather than written.
 *
 * Search engines truncate around 160 characters and reward a description that
 * uses the space, so this picks the longest closing clause that still fits.
 * The sample size and the leading payment term come from the summary, which is
 * why there is no draft version of this string anywhere: it cannot exist
 * before the data does.
 */
const DESCRIPTION_TAILS = [
  ' How long they wait to be paid, how often invoices run late, and what they do about it.',
  ' Payment timing, late payment, deposits and late fees, with the method attached.',
  ' Payment timing, late payment, deposits, late fees and reminder habits.',
  ' Payment timing, late payment, deposits and late-fee practice.',
  ' Payment timing, late payment, deposits and late fees.',
] as const;

export const DESCRIPTION_MAX_LENGTH = 160;

export function benchmarkMetaDescription(summary: BenchmarkSummary): string {
  const base = summary.totalValidResponses;
  const topTerm = largestSubstantive(distribution(summary, 'usual_payment_terms'));

  const lead = topTerm
    ? `${base} small businesses on the terms they put on an invoice: ` +
      `${topTerm.label.toLowerCase()} led at ${topTerm.percent.toFixed(0)}%.`
    : `${base} small businesses on the payment terms they put on their invoices.`;

  const tail = DESCRIPTION_TAILS.find(
    (candidate) => lead.length + candidate.length <= DESCRIPTION_MAX_LENGTH,
  );

  if (tail) return lead + tail;

  return lead.length <= DESCRIPTION_MAX_LENGTH
    ? lead
    : `${lead.slice(0, DESCRIPTION_MAX_LENGTH - 1).trimEnd()}\u2026`;
}
