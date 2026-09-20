/**
 * Generates `synthetic-responses.csv`.
 *
 * SYNTHETIC DATA. Every row is produced by the seeded generator below. No
 * person answered any of these questions, and none of it may ever reach the
 * published report — `tests/unit/research-pipeline.test.ts` asserts that the
 * report page renders only from `data/research/aggregates/`, which this file
 * never feeds.
 *
 * It exists so the validator, the aggregator and the suppression rules have
 * something realistically shaped to run against in CI. The weights are chosen
 * to exercise the code paths — a couple of deliberately thin segments, a
 * handful of single-digit cells — not to resemble any real population.
 *
 * Run: node tests/fixtures/research/generate-synthetic-responses.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROWS = 124;
const FIELDWORK_START = Date.UTC(2026, 6, 6); // 2026-07-06
const FIELDWORK_DAYS = 24;

/** Mulberry32. Deterministic, so regenerating produces an identical file. */
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const next = random(20260920);

function pick(weighted) {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
  let threshold = next() * total;
  for (const [value, weight] of weighted) {
    threshold -= weight;
    if (threshold <= 0) return value;
  }
  return weighted[weighted.length - 1][0];
}

const FIELDS = {
  respondent_role: [
    ['freelancer_sole_proprietor', 34],
    ['small_business_owner', 30],
    ['agency_consultancy_operator', 18],
    // Deliberately thin, so the segment-suppression path is exercised.
    ['bookkeeper_accountant_own_business', 5],
    ['other_business_operator', 4],
  ],
  primary_customer_type: [
    ['mostly_businesses', 52],
    ['mostly_consumers', 26],
    ['equal_mix', 22],
  ],
  region: [
    ['europe', 30],
    ['north_america', 28],
    ['asia', 16],
    ['africa', 12],
    ['oceania', 7],
    ['south_america', 5],
    ['prefer_not_to_say', 4],
  ],
  monthly_invoice_volume: [
    ['1_5', 30],
    ['6_10', 26],
    ['11_25', 22],
    ['26_50', 13],
    ['more_than_50', 9],
  ],
  usual_payment_terms: [
    ['net_30', 28],
    ['due_on_receipt', 20],
    ['net_15', 17],
    ['net_7', 12],
    ['varies_by_customer', 10],
    ['net_45', 6],
    ['net_60_or_longer', 4],
    ['other_or_custom', 3],
  ],
  usual_days_to_payment: [
    ['15_30', 30],
    ['8_14', 22],
    ['31_45', 18],
    ['0_7', 13],
    ['46_60', 8],
    ['more_than_60', 5],
    ['not_sure', 4],
  ],
  late_payment_frequency: [
    ['less_than_a_quarter', 30],
    ['about_a_quarter', 22],
    ['never_or_almost_never', 18],
    ['about_half', 14],
    ['more_than_half', 11],
    ['not_sure', 5],
  ],
  deposit_policy: [
    ['sometimes', 38],
    ['never', 30],
    ['always', 24],
    ['not_applicable', 8],
  ],
  late_fee_policy: [
    ['do_not_state', 36],
    ['state_rarely_enforce', 30],
    ['varies_by_customer', 20],
    ['state_and_enforce', 14],
  ],
  reminder_timing: [
    ['1_7_days_after', 32],
    ['on_due_date', 24],
    ['before_due_date', 20],
    ['more_than_7_days_after', 14],
    ['no_consistent_process', 10],
  ],
  invoice_creation_method: [
    ['accounting_software', 36],
    ['online_generator', 26],
    ['spreadsheet_or_template', 24],
    ['manual', 10],
    ['other', 4],
  ],
};

const columns = [
  'response_id',
  'submitted_at',
  ...Object.keys(FIELDS),
  'consent_to_aggregate',
];

const lines = [columns.join(',')];

for (let index = 0; index < ROWS; index += 1) {
  const day = Math.floor(next() * FIELDWORK_DAYS);
  const submittedAt = new Date(FIELDWORK_START + day * 86400000).toISOString().slice(0, 10);
  const row = [
    `syn-${String(index + 1).padStart(4, '0')}`,
    submittedAt,
    ...Object.values(FIELDS).map((weighted) => pick(weighted)),
    'yes',
  ];
  lines.push(row.join(','));
}

const target = join(dirname(fileURLToPath(import.meta.url)), 'synthetic-responses.csv');
writeFileSync(target, lines.join('\r\n') + '\r\n', 'utf8');
console.log(`Wrote ${ROWS} synthetic rows to ${target}`);
