import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { toCsv } from '@/lib/download/csv';
import {
  AGGREGATE_CSV_COLUMNS,
  ALLOWED_COLUMNS,
  CONSENT_COLUMN,
  DATASET_CONTRACT_VERSION,
  FIELD_DEFINITIONS,
  MINIMUM_VALID_RESPONSES,
  SUPPRESSION_THRESHOLD,
  aggregate,
  aggregateCsvRows,
  formatValidationReport,
  isCalendarDate,
  summaryIntegrityProblems,
  parseBenchmarkSummary,
  parseCsv,
  roundPercent,
  validateResponses,
  type ValidResponse,
} from '@/lib/research/pipeline';

/**
 * The data contract, the validator and the aggregator (task phases 4 and 5).
 *
 * Every fixture in this file is written in the test. Nothing here describes a
 * real respondent, and nothing here may ever be rendered on a public page.
 */

const projectRoot = process.cwd();

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const COLUMNS = [
  'response_id',
  'submitted_at',
  ...FIELD_DEFINITIONS.map((field) => field.name),
  CONSENT_COLUMN,
];

/** A row whose every answer is the field's first option, before overrides. */
function row(overrides: Record<string, string> = {}): string[] {
  const base: Record<string, string> = {
    response_id: overrides.response_id ?? `r${Math.random().toString(36).slice(2, 10)}`,
    submitted_at: '2026-07-10',
    [CONSENT_COLUMN]: 'yes',
  };
  for (const field of FIELD_DEFINITIONS) {
    base[field.name] = field.options[0]?.value ?? '';
  }
  return COLUMNS.map((column) => overrides[column] ?? base[column] ?? '');
}

function csv(rows: string[][], columns: string[] = COLUMNS): string {
  return [columns.join(','), ...rows.map((entry) => entry.join(','))].join('\n');
}

/** A validated response with every field set, for aggregation tests. */
function response(answers: Record<string, string>, submittedOn = '2026-07-10'): ValidResponse {
  const filled: Record<string, string> = {};
  for (const field of FIELD_DEFINITIONS) {
    filled[field.name] = answers[field.name] ?? field.options[0]?.value ?? '';
  }
  return { responseId: null, submittedOn, answers: filled };
}

function reasons(result: ReturnType<typeof validateResponses>): string[] {
  return result.report.rejections.map((entry) => entry.reason);
}

/* -------------------------------------------------------------------------- */

describe('the field contract', () => {
  it('matches the twelve questions in the survey specification', () => {
    expect(FIELD_DEFINITIONS.map((field) => field.name)).toEqual([
      'respondent_role',
      'primary_customer_type',
      'region',
      'monthly_invoice_volume',
      'usual_payment_terms',
      'usual_days_to_payment',
      'late_payment_frequency',
      'deposit_policy',
      'late_fee_policy',
      'reminder_timing',
      'invoice_creation_method',
    ]);
    // The twelfth is consent, which is validated rather than aggregated.
    expect(ALLOWED_COLUMNS).toContain(CONSENT_COLUMN);
  });

  it('allows no column that could carry personal data', () => {
    const forbidden = [
      'email',
      'email_address',
      'name',
      'full_name',
      'phone',
      'client_name',
      'company_name',
      'revenue',
      'ip',
      'ip_address',
      'city',
      'postcode',
      'postal_code',
      'latitude',
      'longitude',
      'comments',
      'notes',
      'free_text',
    ];
    for (const column of forbidden) expect(ALLOWED_COLUMNS).not.toContain(column);
    expect(ALLOWED_COLUMNS).toHaveLength(FIELD_DEFINITIONS.length + 3);
  });

  it('collects region no finer than a continent', () => {
    const region = FIELD_DEFINITIONS.find((field) => field.name === 'region');
    expect(region?.options.map((option) => option.value)).toEqual([
      'africa',
      'asia',
      'europe',
      'north_america',
      'south_america',
      'oceania',
      'prefer_not_to_say',
    ]);
  });
});

describe('CSV reading', () => {
  it('reads quoted fields, doubled quotes, embedded commas and CRLF', () => {
    const parsed = parseCsv('a,b\r\n"x,1","he said ""hi"""\r\n');
    expect(parsed).toEqual([
      ['a', 'b'],
      ['x,1', 'he said "hi"'],
    ]);
  });

  it('strips a byte-order mark and ignores a trailing newline', () => {
    const parsed = parseCsv('﻿a,b\nc,d\n');
    expect(parsed).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });
});

describe('validation', () => {
  it('accepts a well-formed export', () => {
    const result = validateResponses(parseCsv(csv([row(), row(), row()])));
    expect(result.report.fatalErrors).toEqual([]);
    expect(result.report.validRows).toBe(3);
    expect(result.report.rejectedRows).toBe(0);
    expect(result.responses).toHaveLength(3);
  });

  it('rejects every row when the export carries an unexpected column', () => {
    const columns = [...COLUMNS, 'email_address'];
    const rows = [
      [...row(), 'someone@example.com'],
      [...row(), 'another@example.com'],
    ];

    const result = validateResponses(parseCsv(csv(rows, columns)));

    expect(result.report.validRows).toBe(0);
    expect(result.report.rejectedRows).toBe(2);
    expect(result.responses).toEqual([]);
    expect(reasons(result)).toContain('unexpected_column');
    expect(result.report.fatalErrors.join(' ')).toContain('email_address');
  });

  it('rejects an export missing a required column', () => {
    const columns = COLUMNS.filter((column) => column !== 'late_fee_policy');
    const rows = [row().filter((_, index) => COLUMNS[index] !== 'late_fee_policy')];

    const result = validateResponses(parseCsv(csv(rows, columns)));

    expect(result.report.validRows).toBe(0);
    expect(reasons(result)).toContain('missing_required_column');
  });

  it('rejects a row without affirmative consent', () => {
    for (const value of ['', 'no', 'false', '0', 'maybe', 'YES please']) {
      const result = validateResponses(parseCsv(csv([row({ [CONSENT_COLUMN]: value }), row()])));
      expect(result.report.validRows, `consent=${JSON.stringify(value)}`).toBe(1);
      expect(reasons(result)).toContain('consent_not_given');
    }
  });

  it('accepts the documented affirmative consent spellings', () => {
    for (const value of ['yes', 'YES', 'true', '1', 'y', ' yes ']) {
      const result = validateResponses(parseCsv(csv([row({ [CONSENT_COLUMN]: value })])));
      expect(result.report.validRows, `consent=${JSON.stringify(value)}`).toBe(1);
    }
  });

  it('rejects a value outside the documented options', () => {
    const result = validateResponses(
      parseCsv(csv([row({ usual_payment_terms: 'net_37' }), row()])),
    );
    expect(result.report.validRows).toBe(1);
    expect(reasons(result)).toContain('invalid_value');
    expect(result.report.rejections.find((entry) => entry.reason === 'invalid_value')?.field).toBe(
      'usual_payment_terms',
    );
  });

  it('rejects a blank required answer and counts it as missing', () => {
    const result = validateResponses(parseCsv(csv([row({ deposit_policy: '' }), row()])));
    expect(result.report.validRows).toBe(1);
    expect(reasons(result)).toContain('missing_required_field');
    expect(result.report.missingByField.deposit_policy).toBe(1);
  });

  it('rejects the later of two rows sharing a response ID', () => {
    const result = validateResponses(
      parseCsv(csv([row({ response_id: 'abc' }), row({ response_id: 'abc' }), row()])),
    );
    expect(result.report.validRows).toBe(2);
    expect(reasons(result)).toContain('duplicate_response_id');
  });

  it('rejects a response ID that is not an opaque token', () => {
    const result = validateResponses(parseCsv(csv([row({ response_id: 'a b@c' })])));
    expect(reasons(result)).toContain('invalid_response_id');
  });

  it('keeps only the date from a submission timestamp', () => {
    const result = validateResponses(
      parseCsv(csv([row({ submitted_at: '2026-07-14T22:41:09Z' })])),
    );
    expect(result.responses[0]?.submittedOn).toBe('2026-07-14');
  });

  it('rejects an unparseable submission timestamp', () => {
    const result = validateResponses(parseCsv(csv([row({ submitted_at: 'last Tuesday' })])));
    expect(reasons(result)).toContain('invalid_submitted_at');
  });

  it('rejects a row with the wrong number of fields', () => {
    const malformed = csv([row()]) + '\none,two,three';
    const result = validateResponses(parseCsv(malformed));
    expect(reasons(result)).toContain('column_count_mismatch');
  });

  it('gates the minimum sample size at the documented floor', () => {
    const under = validateResponses(
      parseCsv(csv(Array.from({ length: MINIMUM_VALID_RESPONSES - 1 }, () => row()))),
    );
    expect(under.report.validRows).toBe(MINIMUM_VALID_RESPONSES - 1);
    expect(under.report.meetsMinimumSample).toBe(false);

    const exactly = validateResponses(
      parseCsv(csv(Array.from({ length: MINIMUM_VALID_RESPONSES }, () => row()))),
    );
    expect(exactly.report.meetsMinimumSample).toBe(true);
  });
});

describe('the validation report', () => {
  it('never prints a response value, even from a rejected row', () => {
    const secret = 'zzconfidentialvaluezz';
    const columns = [...COLUMNS, 'client_name'];
    const rows = [[...row({ usual_payment_terms: secret }), secret]];

    const result = validateResponses(parseCsv(csv(rows, columns)));
    const printed = formatValidationReport(result.report);

    expect(printed).not.toContain(secret);
    // Column names are structure, not response data, and naming them is the
    // only way an owner can fix a bad export.
    expect(printed).toContain('client_name');
  });

  it('never prints a response ID', () => {
    const result = validateResponses(
      parseCsv(csv([row({ response_id: 'idzzz9' }), row({ response_id: 'idzzz9' })])),
    );
    expect(formatValidationReport(result.report)).not.toContain('idzzz9');
  });

  it('reports totals, reasons and per-field blanks', () => {
    const result = validateResponses(
      parseCsv(csv([row(), row({ region: '' }), row({ [CONSENT_COLUMN]: 'no' })])),
    );
    const printed = formatValidationReport(result.report);

    expect(result.report.inputRows).toBe(3);
    expect(result.report.validRows).toBe(1);
    expect(result.report.rejectedRows).toBe(2);
    expect(printed).toContain('missing_required_field');
    expect(printed).toContain('consent_not_given');
    expect(printed).toContain('region: 1');
    expect(result.report.contractVersion).toBe(DATASET_CONTRACT_VERSION);
  });
});

describe('aggregation', () => {
  const responses = [
    ...Array.from({ length: 40 }, () => response({ usual_payment_terms: 'net_30' })),
    ...Array.from({ length: 30 }, () => response({ usual_payment_terms: 'net_15' })),
    ...Array.from({ length: 20 }, () => response({ usual_payment_terms: 'due_on_receipt' })),
    ...Array.from({ length: 10 }, () => response({ usual_payment_terms: 'other_or_custom' })),
  ];

  it('counts every valid response and states the fieldwork window', () => {
    const summary = aggregate([
      response({}, '2026-07-06'),
      response({}, '2026-07-29'),
      response({}, '2026-07-14'),
    ]);
    expect(summary.totalValidResponses).toBe(3);
    expect(summary.fieldwork).toEqual({ start: '2026-07-06', end: '2026-07-29' });
  });

  it('distributes over the whole valid sample', () => {
    const summary = aggregate(responses);
    const terms = summary.distributions.find((entry) => entry.field === 'usual_payment_terms');

    expect(terms?.base).toBe(100);
    expect(terms?.rows.find((entry) => entry.value === 'net_30')).toMatchObject({
      count: 40,
      percent: 40,
    });
    expect(terms?.rows.reduce((total, entry) => total + entry.count, 0)).toBe(100);
  });

  it('keeps "Other" in the denominator and says so', () => {
    const summary = aggregate(responses);
    const terms = summary.distributions.find((entry) => entry.field === 'usual_payment_terms');

    expect(terms?.rows.find((entry) => entry.value === 'other_or_custom')?.nonSubstantive).toBe(
      true,
    );
    expect(terms?.denominatorNote).toContain('10');
    expect(terms?.denominatorNote).toContain('Other or custom');
    expect(terms?.denominatorNote).toContain('kept in the denominator');
  });

  it('rounds to one decimal place, half away from zero', () => {
    expect(roundPercent(1, 3)).toBe(33.3);
    expect(roundPercent(2, 3)).toBe(66.7);
    expect(roundPercent(1, 8)).toBe(12.5);
    expect(roundPercent(0, 0)).toBe(0);
  });

  it('documents that rounded shares need not total exactly 100%', () => {
    const summary = aggregate([
      response({ usual_payment_terms: 'net_30' }),
      response({ usual_payment_terms: 'net_15' }),
      response({ usual_payment_terms: 'net_7' }),
    ]);
    const terms = summary.distributions.find((entry) => entry.field === 'usual_payment_terms');
    const total = terms?.rows.reduce((sum, entry) => sum + entry.percent, 0) ?? 0;

    expect(total).toBeCloseTo(99.9, 5);
    expect(summary.rounding.note).toContain('99.9% or 100.1%');
    expect(summary.rounding.decimals).toBe(1);
  });

  it('computes no mean, median or average from a bucketed answer', () => {
    const serialised = JSON.stringify(aggregate(responses)).toLowerCase();
    for (const forbidden of ['"mean"', '"median"', '"average"', 'averagedays', 'middaysvalue']) {
      expect(serialised).not.toContain(forbidden);
    }
  });

  it('never carries a response-level row into the summary', () => {
    const summary = aggregate([response({}, '2026-07-06')]);
    const serialised = JSON.stringify(summary);

    // Key probes, not bare words: the prose in a denominator note legitimately
    // contains "answered", and a substring match would pass for the wrong reason.
    expect(serialised).not.toContain('"responseId"');
    expect(serialised).not.toContain('"answers"');
    expect(serialised).not.toContain('"submittedOn"');
    expect(Object.keys(summary)).not.toContain('responses');
  });
});

describe('small-cell suppression', () => {
  /** `count` respondents in `role` who all chose `terms`. */
  function cohort(role: string, terms: string, count: number): ValidResponse[] {
    return Array.from({ length: count }, () =>
      response({ respondent_role: role, usual_payment_terms: terms }),
    );
  }

  it('withholds a whole segment below the threshold', () => {
    const summary = aggregate([
      ...cohort('freelancer_sole_proprietor', 'net_30', 40),
      ...cohort('small_business_owner', 'net_30', 40),
      // Nine is one short of the threshold.
      ...cohort('agency_consultancy_operator', 'net_15', SUPPRESSION_THRESHOLD - 1),
    ]);

    const crossTab = summary.crossTabs.find((entry) => entry.id === 'payment-terms-by-role');
    const thin = crossTab?.segments.find((entry) => entry.value === 'agency_consultancy_operator');

    expect(thin?.base).toBe(SUPPRESSION_THRESHOLD - 1);
    expect(thin?.suppressed).toBe(true);
    expect(thin?.cells.every((cell) => cell.count === null && cell.percent === null)).toBe(true);
    expect(crossTab?.suppressedSegments).toBeGreaterThanOrEqual(1);
  });

  it('withholds a cell below the threshold inside a reportable segment', () => {
    const summary = aggregate([
      ...cohort('freelancer_sole_proprietor', 'net_30', 30),
      ...cohort('freelancer_sole_proprietor', 'net_15', 12),
      ...cohort('freelancer_sole_proprietor', 'net_7', 4),
      ...cohort('freelancer_sole_proprietor', 'due_on_receipt', 3),
    ]);

    const segment = summary.crossTabs
      .find((entry) => entry.id === 'payment-terms-by-role')
      ?.segments.find((entry) => entry.value === 'freelancer_sole_proprietor');

    expect(segment?.suppressed).toBe(false);
    expect(segment?.base).toBe(49);

    const cell = (value: string) => segment?.cells.find((entry) => entry.value === value);
    expect(cell('net_30')?.count).toBe(30);
    expect(cell('net_15')?.count).toBe(12);
    expect(cell('net_7')).toMatchObject({ count: null, percent: null, suppressed: true });
    expect(cell('due_on_receipt')).toMatchObject({ count: null, suppressed: true });
  });

  it('withholds a second cell when the first could be derived by subtraction', () => {
    // One small cell, everything else large: publishing the large ones would
    // give the small one away as base minus the rest.
    const summary = aggregate([
      ...cohort('small_business_owner', 'net_30', 30),
      ...cohort('small_business_owner', 'net_15', 25),
      ...cohort('small_business_owner', 'net_7', 2),
    ]);

    const segment = summary.crossTabs
      .find((entry) => entry.id === 'payment-terms-by-role')
      ?.segments.find((entry) => entry.value === 'small_business_owner');

    const withheld = segment?.cells.filter((cell) => cell.suppressed) ?? [];
    expect(withheld.length).toBeGreaterThanOrEqual(2);
    expect(withheld.some((cell) => cell.value === 'net_7')).toBe(true);
  });

  it('calculates a visible cell as a share of its own segment', () => {
    const summary = aggregate([
      ...cohort('freelancer_sole_proprietor', 'net_30', 30),
      ...cohort('freelancer_sole_proprietor', 'net_15', 10),
      ...cohort('freelancer_sole_proprietor', 'net_7', 10),
    ]);

    const segment = summary.crossTabs
      .find((entry) => entry.id === 'payment-terms-by-role')
      ?.segments.find((entry) => entry.value === 'freelancer_sole_proprietor');

    expect(segment?.base).toBe(50);
    expect(segment?.cells.find((cell) => cell.value === 'net_30')?.percent).toBe(60);
  });

  it('cross-tabulates late payment by the terms used', () => {
    const summary = aggregate([
      ...Array.from({ length: 20 }, () =>
        response({ usual_payment_terms: 'net_30', late_payment_frequency: 'about_half' }),
      ),
      ...Array.from({ length: 20 }, () =>
        response({ usual_payment_terms: 'net_30', late_payment_frequency: 'about_a_quarter' }),
      ),
    ]);

    const crossTab = summary.crossTabs.find((entry) => entry.id === 'late-payment-by-terms');
    expect(crossTab?.segmentField).toBe('usual_payment_terms');
    expect(crossTab?.measureField).toBe('late_payment_frequency');

    const segment = crossTab?.segments.find((entry) => entry.value === 'net_30');
    expect(segment?.base).toBe(40);
    expect(segment?.cells.find((cell) => cell.value === 'about_half')?.percent).toBe(50);
  });
});

describe('the summary contract', () => {
  it('round-trips through the strict schema', () => {
    const summary = aggregate(Array.from({ length: 20 }, () => response({})));
    expect(() => parseBenchmarkSummary(JSON.parse(JSON.stringify(summary)))).not.toThrow();
  });

  it('refuses a summary carrying an unexpected key', () => {
    const summary = JSON.parse(
      JSON.stringify(aggregate(Array.from({ length: 20 }, () => response({})))),
    ) as Record<string, unknown>;
    summary.rawResponses = [{ region: 'europe' }];

    expect(() => parseBenchmarkSummary(summary)).toThrow();
  });

  it('refuses a summary built against a different contract version', () => {
    const summary = JSON.parse(
      JSON.stringify(aggregate(Array.from({ length: 20 }, () => response({})))),
    ) as Record<string, unknown>;
    summary.contractVersion = 'invoice-payment-terms-2026.v0';

    expect(() => parseBenchmarkSummary(summary)).toThrow();
  });
});

describe('the public aggregate CSV', () => {
  const summary = aggregate([
    ...Array.from({ length: 60 }, () => response({ usual_payment_terms: 'net_30' })),
    ...Array.from({ length: 40 }, () => response({ usual_payment_terms: 'net_15' })),
  ]);

  it('writes one row per published figure, with its base', () => {
    const rows = aggregateCsvRows(summary);
    const terms = rows.filter(
      (entry) => entry.table === 'usual_payment_terms' && entry.segment_value === 'all',
    );

    expect(terms.find((entry) => entry.option_value === 'net_30')).toMatchObject({
      respondents: '60',
      percent: '60.0',
      denominator: '100',
      suppressed: 'no',
    });
  });

  it('states which cells were withheld instead of omitting them', () => {
    const withheld = aggregateCsvRows(summary).filter((entry) => entry.suppressed === 'yes');
    expect(withheld.length).toBeGreaterThan(0);
    for (const entry of withheld) expect(entry.respondents).toBe('');
  });

  it('serialises through the project CSV writer', () => {
    const rows = aggregateCsvRows(summary);
    const text = toCsv(
      rows,
      AGGREGATE_CSV_COLUMNS.map((column) => ({
        header: column.header,
        value: (entry: (typeof rows)[number]) => entry[column.key],
      })),
    );

    expect(text.split('\r\n')[0]).toBe(
      'table,segment_value,segment_label,option_value,option_label,respondents,percent,denominator,suppressed',
    );
    expect(text).not.toContain('response_id');
  });
});

describe('private data never enters the repository', () => {
  it('ignores raw exports in .gitignore', () => {
    const ignore = readFileSync(join(projectRoot, '.gitignore'), 'utf8');
    expect(ignore).toContain('data/research/private/');
    expect(ignore).toContain('*.private.csv');
  });

  it('tracks no file that looks like a response-level export', () => {
    const tracked = execFileSync('git', ['ls-files'], { cwd: projectRoot, encoding: 'utf8' })
      .split('\n')
      .filter(Boolean);

    const offenders = tracked.filter(
      (path) => path.includes('.private.') || path.startsWith('data/research/private/'),
    );
    expect(offenders).toEqual([]);
  });

  it('publishes no response-level file from public/ or data/', () => {
    const tracked = execFileSync('git', ['ls-files', 'public', 'data'], {
      cwd: projectRoot,
      encoding: 'utf8',
    })
      .split('\n')
      .filter((path) => path.endsWith('.csv') || path.endsWith('.json'));

    for (const path of tracked) {
      const header = readFileSync(join(projectRoot, path), 'utf8').slice(0, 400);
      expect(header, `${path} carries a response-level column`).not.toContain(CONSENT_COLUMN);
    }
  });

  it('keeps the synthetic fixture out of the published aggregates', () => {
    const tracked = execFileSync('git', ['ls-files', 'public', 'data'], {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    expect(tracked).not.toContain('synthetic');
  });
});

describe('the synthetic fixture', () => {
  const fixture = readFileSync(
    join(projectRoot, 'tests/fixtures/research/synthetic-responses.csv'),
    'utf8',
  );

  it('satisfies the same contract a real export must', () => {
    const result = validateResponses(parseCsv(fixture));
    expect(result.report.fatalErrors).toEqual([]);
    expect(result.report.rejectedRows).toBe(0);
    expect(result.report.validRows).toBeGreaterThanOrEqual(MINIMUM_VALID_RESPONSES);
  });

  it('is labelled as synthetic where somebody would look for it', () => {
    const readme = readFileSync(join(projectRoot, 'tests/fixtures/research/README.md'), 'utf8');
    expect(readme).toContain('SYNTHETIC');
    expect(fixture).toContain('syn-0001');
  });

  it('exercises both suppression paths, so the rules are covered by real use', () => {
    const { responses } = validateResponses(parseCsv(fixture));
    const summary = aggregate(responses);
    const totals = summary.crossTabs.reduce(
      (acc, tab) => ({
        segments: acc.segments + tab.suppressedSegments,
        cells: acc.cells + tab.suppressedCells,
      }),
      { segments: 0, cells: 0 },
    );

    expect(totals.segments).toBeGreaterThan(0);
    expect(totals.cells).toBeGreaterThan(0);
  });
});

/* -------------------------------------------------------------------------- */
/* Review fixes                                                               */
/* -------------------------------------------------------------------------- */

describe('calendar dates', () => {
  it('rejects a date that does not exist', () => {
    // `Date.parse('2026-02-31T00:00:00Z')` does not fail — it returns 3 March.
    for (const value of ['2026-02-31', '2026-13-01', '2025-02-29', '2026-04-31', '2026-00-10']) {
      expect(isCalendarDate(value), value).toBe(false);
    }
    for (const value of ['2024-02-29', '2026-07-06', '2026-12-31']) {
      expect(isCalendarDate(value), value).toBe(true);
    }
  });

  it('rejects an export row carrying an impossible submission date', () => {
    const result = validateResponses(parseCsv(csv([row({ submitted_at: '2026-02-31' }), row()])));
    expect(result.report.validRows).toBe(1);
    expect(reasons(result)).toContain('invalid_submitted_at');
  });

  it('never silently reports a different day than the export stated', () => {
    const result = validateResponses(
      parseCsv(csv([row({ submitted_at: '2026-02-31T10:00:00Z' })])),
    );
    expect(result.responses).toHaveLength(0);
  });

  it('reads an offsetless timestamp as UTC, not as the machine timezone', () => {
    // The suite pins TZ to America/New_York; local parsing would roll this to
    // the 15th and make fieldwork dates depend on where the build ran.
    const result = validateResponses(parseCsv(csv([row({ submitted_at: '2026-07-14T22:41:09' })])));
    expect(result.responses[0]?.submittedOn).toBe('2026-07-14');
  });
});

describe('suppression survives the marginals the report also publishes', () => {
  /**
   * The attack, written from the reader's side rather than reusing the
   * pipeline's own helper: take the published cross-tab, the published segment
   * distribution (every row total) and the published measure distribution
   * (every column total), then fill in any line with a single unknown, over and
   * over, until nothing more can be derived.
   */
  function reconstruct(summary: ReturnType<typeof aggregate>, crossTabId: string) {
    const crossTab = summary.crossTabs.find((entry) => entry.id === crossTabId);
    if (!crossTab) throw new Error(`no cross-tab ${crossTabId}`);

    const marginalOf = (field: string) => {
      const distribution = summary.distributions.find((entry) => entry.field === field);
      if (!distribution) throw new Error(`no distribution ${field}`);
      return distribution;
    };

    const segmentMarginal = marginalOf(crossTab.segmentField);
    const measureMarginal = marginalOf(crossTab.measureField);

    const rowTotals = crossTab.segments.map(
      (segment) => segmentMarginal.rows.find((entry) => entry.value === segment.value)?.count ?? 0,
    );
    const colTotals = (crossTab.segments[0]?.cells ?? []).map(
      (cell) => measureMarginal.rows.find((entry) => entry.value === cell.value)?.count ?? 0,
    );

    const grid: (number | null)[][] = crossTab.segments.map((segment) =>
      segment.cells.map((cell) => cell.count),
    );
    const recovered: { row: string; col: string; value: number }[] = [];

    let progress = true;
    while (progress) {
      progress = false;

      grid.forEach((cells, r) => {
        const unknown = cells.flatMap((cell, c) => (cell === null ? [c] : []));
        if (unknown.length !== 1) return;
        const c = unknown[0]!;
        const value =
          (rowTotals[r] ?? 0) - cells.reduce<number>((sum, cell) => sum + (cell ?? 0), 0);
        cells[c] = value;
        recovered.push({
          row: crossTab.segments[r]?.value ?? '?',
          col: crossTab.segments[r]?.cells[c]?.value ?? '?',
          value,
        });
        progress = true;
      });

      colTotals.forEach((total, c) => {
        const unknown = grid.flatMap((cells, r) => (cells[c] === null ? [r] : []));
        if (unknown.length !== 1) return;
        const r = unknown[0]!;
        const value = total - grid.reduce<number>((sum, cells) => sum + (cells[c] ?? 0), 0);
        grid[r]![c] = value;
        recovered.push({
          row: crossTab.segments[r]?.value ?? '?',
          col: crossTab.segments[r]?.cells[c]?.value ?? '?',
          value,
        });
        progress = true;
      });
    }

    return recovered;
  }

  function cohort(role: string, terms: string, count: number): ValidResponse[] {
    return Array.from({ length: count }, () =>
      response({ respondent_role: role, usual_payment_terms: terms }),
    );
  }

  it('has teeth: the same attack recovers a cell hidden only row-wise', () => {
    /*
     * Row-only suppression, which is what this pipeline used to do. Both rows
     * satisfy "no row has exactly one withheld cell", and the 3 is still handed
     * over by its column: 3 = colTotal − the zero above it.
     */
    const grid: (number | null)[][] = [
      [0, 12, 30],
      [null, null, 20],
    ];
    const colTotals = [3, 27, 50];

    let progress = true;
    while (progress) {
      progress = false;
      colTotals.forEach((total, c) => {
        const unknown = grid.flatMap((cells, r) => (cells[c] === null ? [r] : []));
        if (unknown.length !== 1) return;
        const r = unknown[0]!;
        grid[r]![c] = total - grid.reduce<number>((sum, cells) => sum + (cells[c] ?? 0), 0);
        progress = true;
      });
    }

    expect(grid[1]?.[0]).toBe(3);
  });

  it('leaves nothing derivable in either cross-tab of a realistic sample', () => {
    const fixture = readFileSync(
      join(projectRoot, 'tests/fixtures/research/synthetic-responses.csv'),
      'utf8',
    );
    const summary = aggregate(validateResponses(parseCsv(fixture)).responses);

    for (const crossTab of summary.crossTabs) {
      const recovered = reconstruct(summary, crossTab.id);
      const disclosed = recovered.filter(
        (entry) => entry.value > 0 && entry.value < SUPPRESSION_THRESHOLD,
      );
      expect(disclosed, `${crossTab.id} leaks ${JSON.stringify(disclosed)}`).toEqual([]);
    }
  });

  it('leaves nothing derivable when one lone row would give a column away', () => {
    // Every role reportable except one, which holds the only small cells: the
    // column pass has to withhold a second figure or the row is recoverable.
    const summary = aggregate([
      ...cohort('freelancer_sole_proprietor', 'net_30', 40),
      ...cohort('small_business_owner', 'net_30', 35),
      ...cohort('agency_consultancy_operator', 'net_30', 25),
      ...cohort('other_business_operator', 'net_7', 4),
    ]);

    const recovered = reconstruct(summary, 'payment-terms-by-role');
    expect(
      recovered.filter((entry) => entry.value > 0 && entry.value < SUPPRESSION_THRESHOLD),
    ).toEqual([]);
  });

  it('withholds the whole table rather than publishing one that leaks', () => {
    // Two segments, two live answers: nothing can be shown without giving the
    // other away, so the table is withheld in full.
    const summary = aggregate([
      ...cohort('freelancer_sole_proprietor', 'net_30', 20),
      ...cohort('small_business_owner', 'net_15', 20),
    ]);
    expect(
      reconstruct(summary, 'payment-terms-by-role').filter(
        (entry) => entry.value > 0 && entry.value < SUPPRESSION_THRESHOLD,
      ),
    ).toEqual([]);
  });
});

describe('summary integrity, not merely summary shape', () => {
  /** Two reportable roles, each with a small cell, so suppression is exercised. */
  const clean = () => {
    const responses = ['freelancer_sole_proprietor', 'small_business_owner'].flatMap((role) => [
      ...Array.from({ length: 20 }, () =>
        response({ respondent_role: role, usual_payment_terms: 'net_30' }),
      ),
      ...Array.from({ length: 12 }, () =>
        response({ respondent_role: role, usual_payment_terms: 'net_15' }),
      ),
      ...Array.from({ length: 8 }, () =>
        response({ respondent_role: role, usual_payment_terms: 'net_7' }),
      ),
    ]);
    return JSON.parse(JSON.stringify(aggregate(responses))) as Record<string, any>;
  };

  it('accepts its own output', () => {
    expect(summaryIntegrityProblems(clean() as never)).toEqual([]);
    expect(() => parseBenchmarkSummary(clean())).not.toThrow();
  });

  it('rejects a base that contradicts the sample size', () => {
    const summary = clean();
    summary.distributions[0].base = 999;
    expect(() => parseBenchmarkSummary(summary)).toThrow(/base of 999 against a sample of 80/);
  });

  it('rejects counts that do not sum to their base', () => {
    const summary = clean();
    summary.distributions[0].rows[0].count += 5;
    expect(() => parseBenchmarkSummary(summary)).toThrow(/counts 85 answers against a base of 80/);
  });

  it('rejects a percentage that does not match its count', () => {
    const summary = clean();
    summary.distributions[0].rows[0].percent = 12.3;
    expect(() => parseBenchmarkSummary(summary)).toThrow(/percentage for .* does not match/);
  });

  it('rejects a relabelled or reordered option', () => {
    const summary = clean();
    summary.distributions[0].rows[0].label = 'Something else';
    expect(() => parseBenchmarkSummary(summary)).toThrow(/relabels/);
  });

  it('rejects a published cell below the suppression threshold', () => {
    const summary = clean();
    const segment = summary.crossTabs[0].segments.find((entry: any) => !entry.suppressed);
    const cell = segment.cells.find((entry: any) => entry.suppressed);
    cell.suppressed = false;
    cell.count = 4;
    cell.percent = 10;
    expect(() => parseBenchmarkSummary(summary)).toThrow(/below the threshold/);
  });

  it('rejects fieldwork dates that are impossible or out of order', () => {
    const impossible = clean();
    impossible.fieldwork = { start: '2026-02-31', end: '2026-07-29' };
    expect(() => parseBenchmarkSummary(impossible)).toThrow(/not a real date/);

    const backwards = clean();
    backwards.fieldwork = { start: '2026-07-29', end: '2026-07-06' };
    expect(() => parseBenchmarkSummary(backwards)).toThrow(/start is after/);
  });

  it('rejects a miscounted suppression tally', () => {
    const summary = clean();
    summary.crossTabs[0].suppressedCells += 3;
    expect(() => parseBenchmarkSummary(summary)).toThrow(/miscounts its withheld cells/);
  });

  it('rejects meetsMinimumSample when it contradicts the count', () => {
    const summary = clean();
    summary.meetsMinimumSample = true;
    expect(() => parseBenchmarkSummary(summary)).toThrow(/contradicts totalValidResponses/);
  });
});

describe('the aggregate CSV cannot reach the web without the gate', () => {
  const buildScript = readFileSync(
    join(projectRoot, 'scripts/research/build-benchmark.mjs'),
    'utf8',
  );
  const publishScript = readFileSync(
    join(projectRoot, 'scripts/research/publish-benchmark.mjs'),
    'utf8',
  );

  it('never writes into public/ from the build command', () => {
    const code = buildScript.replace(/\/\*[\s\S]*?\*\//g, ' ');
    expect(code).not.toMatch(/writeFileSync\([^)]*PUBLIC/);
    expect(code).not.toContain("'public/");
  });

  it('runs the full publication gate before publishing', () => {
    expect(publishScript).toContain('publicationBlockers');
    expect(publishScript).toContain('NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED');
    // And clears a stale published file when the gate closes again.
    expect(publishScript).toContain('rmSync');
  });

  it('derives the published bytes from the summary instead of copying a file', () => {
    // The summary is the artefact that passed the schema, the arithmetic audit
    // and the disclosure check. The CSV beside it is a rendering that nothing
    // re-checks, so it is never the thing that gets published.
    expect(publishScript).toContain('aggregateCsvRows(summary)');
    expect(publishScript).not.toContain('copyFileSync');
  });

  it('cannot publish a tampered CSV, because it regenerates one', () => {
    const summary = aggregate([
      ...Array.from({ length: 60 }, () => response({ usual_payment_terms: 'net_30' })),
      ...Array.from({ length: 40 }, () => response({ usual_payment_terms: 'net_15' })),
    ]);

    const columns = AGGREGATE_CSV_COLUMNS.map((column) => ({
      header: column.header,
      value: (entry: ReturnType<typeof aggregateCsvRows>[number]) => entry[column.key],
    }));
    const authoritative = toCsv(aggregateCsvRows(summary), columns);

    // Two ways a stored file could go wrong: an altered figure, and a
    // response-level column appearing where only aggregates belong.
    const alteredFigure = authoritative.replace('net_30,Net 30,60', 'net_30,Net 30,9999');
    const contaminated = `${authoritative}respondent_row,europe,net_30,yes\r\n`;

    expect(alteredFigure).not.toBe(authoritative);
    expect(contaminated).not.toBe(authoritative);

    // Whatever the stored file says, this is what the publish command writes.
    const republished = toCsv(aggregateCsvRows(summary), columns);
    expect(republished).toBe(authoritative);
    expect(republished).not.toContain('9999');
    expect(republished).not.toContain('respondent_row');
  });

  it('rewrites the stored copy from the summary too, so the two cannot disagree', () => {
    expect(publishScript).toContain('writeFileSync(storedCsv, derived');
    expect(publishScript).toContain('writeFileSync(publicCsv, derived');
  });

  it('ships no published aggregate in the repository today', () => {
    const tracked = execFileSync('git', ['ls-files', 'public'], {
      cwd: projectRoot,
      encoding: 'utf8',
    });
    expect(tracked).not.toContain('research/');
  });
});
