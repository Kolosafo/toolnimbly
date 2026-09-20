import { z } from 'zod';

/**
 * The invoice payment terms benchmark data pipeline.
 *
 * One self-contained module on purpose: it is loaded three ways — by Vitest,
 * by the report page through the `@/` alias, and by `scripts/research/*.mjs`
 * through a relative `.ts` specifier that Node type-strips. That last consumer
 * cannot resolve `@/` aliases or extensionless relative imports, so this file
 * imports nothing but `zod`, does no file I/O, and leaves reading and writing
 * to its callers. See ADR 0010.
 *
 * What it guarantees:
 * - Only the columns in the survey specification are accepted. An export with
 *   any other column is rejected in full, because the likeliest extra column is
 *   an email address or a free-text comment.
 * - A row without affirmative consent is never counted.
 * - Nothing it returns, prints or serialises contains a response-level row.
 * - Segmented cells below the suppression threshold are withheld, and a lone
 *   suppressed cell is paired with a second so the first cannot be derived by
 *   subtraction.
 * - No mean or median is computed from a bucketed answer, because the survey
 *   never measured a number of days.
 */

/** Bumped whenever a field, an allowed value or the consent rule changes. */
export const DATASET_CONTRACT_VERSION = 'invoice-payment-terms-2026.v1';

/** Publication floor. Not a claim of statistical representativeness. */
export const MINIMUM_VALID_RESPONSES = 100;

/** The preferred target the owner is aiming for. */
export const PREFERRED_VALID_RESPONSES = 150;

/** Segmented cells with fewer respondents than this are withheld. */
export const SUPPRESSION_THRESHOLD = 10;

/** Percentages are rounded to this many decimal places, half away from zero. */
export const PERCENT_DECIMALS = 1;

export const ROUNDING_NOTE =
  'Percentages are rounded to one decimal place, half away from zero, and are calculated ' +
  'independently of one another. No largest-remainder adjustment is applied, so a column may ' +
  'total 99.9% or 100.1% rather than exactly 100%.';

export const SUPPRESSION_NOTE =
  `Any segment cell representing fewer than ${SUPPRESSION_THRESHOLD} respondents is withheld, ` +
  'as is any segment with fewer than that many respondents in total. Because this report also ' +
  'publishes the overall distribution of each question, a single withheld cell in a row or a ' +
  'column could be recovered by subtracting the figures still shown, so further cells are ' +
  'withheld until no row and no column has exactly one withheld figure. Where a table cannot ' +
  'satisfy that, it is withheld in full.';

/* -------------------------------------------------------------------------- */
/* Field contract                                                             */
/* -------------------------------------------------------------------------- */

export type FieldOption = {
  readonly value: string;
  readonly label: string;
  /**
   * `Not sure`, `Other`, `Prefer not to say`. These stay in the denominator and
   * are labelled in the report rather than being quietly dropped, which would
   * inflate every other share.
   */
  readonly nonSubstantive?: true;
};

export type FieldDefinition = {
  readonly name: string;
  readonly question: string;
  readonly options: readonly FieldOption[];
};

export const FIELD_DEFINITIONS = [
  {
    name: 'respondent_role',
    question: 'Which best describes you?',
    options: [
      { value: 'freelancer_sole_proprietor', label: 'Freelancer or sole proprietor' },
      { value: 'small_business_owner', label: 'Small-business owner' },
      {
        value: 'bookkeeper_accountant_own_business',
        label: 'Bookkeeper or accountant answering about their own business',
      },
      { value: 'agency_consultancy_operator', label: 'Agency or consultancy operator' },
      { value: 'other_business_operator', label: 'Other business operator', nonSubstantive: true },
    ],
  },
  {
    name: 'primary_customer_type',
    question: 'Who do you invoice most often?',
    options: [
      { value: 'mostly_businesses', label: 'Mostly businesses' },
      { value: 'mostly_consumers', label: 'Mostly consumers' },
      { value: 'equal_mix', label: 'Approximately equal mix' },
    ],
  },
  {
    name: 'region',
    question: 'Which region is your business based in?',
    options: [
      { value: 'africa', label: 'Africa' },
      { value: 'asia', label: 'Asia' },
      { value: 'europe', label: 'Europe' },
      { value: 'north_america', label: 'North America' },
      { value: 'south_america', label: 'South America' },
      { value: 'oceania', label: 'Oceania' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say', nonSubstantive: true },
    ],
  },
  {
    name: 'monthly_invoice_volume',
    question: 'How many invoices do you send in a typical month?',
    options: [
      { value: '1_5', label: '1–5' },
      { value: '6_10', label: '6–10' },
      { value: '11_25', label: '11–25' },
      { value: '26_50', label: '26–50' },
      { value: 'more_than_50', label: 'More than 50' },
    ],
  },
  {
    name: 'usual_payment_terms',
    question: 'What payment terms do you usually put on an invoice?',
    options: [
      { value: 'due_on_receipt', label: 'Due on receipt' },
      { value: 'net_7', label: 'Net 7' },
      { value: 'net_15', label: 'Net 15' },
      { value: 'net_30', label: 'Net 30' },
      { value: 'net_45', label: 'Net 45' },
      { value: 'net_60_or_longer', label: 'Net 60 or longer' },
      { value: 'varies_by_customer', label: 'Varies by customer' },
      { value: 'other_or_custom', label: 'Other or custom', nonSubstantive: true },
    ],
  },
  {
    name: 'usual_days_to_payment',
    question: 'How long do you usually wait to actually be paid, from the invoice date?',
    options: [
      { value: '0_7', label: '0–7 days' },
      { value: '8_14', label: '8–14 days' },
      { value: '15_30', label: '15–30 days' },
      { value: '31_45', label: '31–45 days' },
      { value: '46_60', label: '46–60 days' },
      { value: 'more_than_60', label: 'More than 60 days' },
      { value: 'not_sure', label: 'Not sure', nonSubstantive: true },
    ],
  },
  {
    name: 'late_payment_frequency',
    question: 'Roughly how many of your invoices are paid after the due date?',
    options: [
      { value: 'never_or_almost_never', label: 'Never or almost never' },
      { value: 'less_than_a_quarter', label: 'Less than one quarter of invoices' },
      { value: 'about_a_quarter', label: 'About one quarter' },
      { value: 'about_half', label: 'About half' },
      { value: 'more_than_half', label: 'More than half' },
      { value: 'not_sure', label: 'Not sure', nonSubstantive: true },
    ],
  },
  {
    name: 'deposit_policy',
    question: 'Do you ask for a deposit before starting work?',
    options: [
      { value: 'always', label: 'Always require a deposit' },
      { value: 'sometimes', label: 'Sometimes require a deposit' },
      { value: 'never', label: 'Never require a deposit' },
      { value: 'not_applicable', label: 'Not applicable', nonSubstantive: true },
    ],
  },
  {
    name: 'late_fee_policy',
    question: 'How do you handle late fees?',
    options: [
      { value: 'state_and_enforce', label: 'State and enforce late fees' },
      { value: 'state_rarely_enforce', label: 'State late fees but rarely enforce them' },
      { value: 'do_not_state', label: 'Do not state late fees' },
      { value: 'varies_by_customer', label: 'Varies by customer' },
    ],
  },
  {
    name: 'reminder_timing',
    question: 'When do you usually send a payment reminder?',
    options: [
      { value: 'before_due_date', label: 'Before the due date' },
      { value: 'on_due_date', label: 'On the due date' },
      { value: '1_7_days_after', label: '1–7 days after the due date' },
      { value: 'more_than_7_days_after', label: 'More than 7 days after the due date' },
      { value: 'no_consistent_process', label: 'No consistent reminder process' },
    ],
  },
  {
    name: 'invoice_creation_method',
    question: 'How do you usually create an invoice?',
    options: [
      { value: 'accounting_software', label: 'Accounting or invoicing software' },
      { value: 'online_generator', label: 'Online invoice generator' },
      { value: 'spreadsheet_or_template', label: 'Spreadsheet or document template' },
      { value: 'manual', label: 'Manually written' },
      { value: 'other', label: 'Other', nonSubstantive: true },
    ],
  },
] as const satisfies readonly FieldDefinition[];

export type ResearchField = (typeof FIELD_DEFINITIONS)[number]['name'];

/** The consent column. Required, affirmative, and never aggregated. */
export const CONSENT_COLUMN = 'consent_to_aggregate';

/** Produced by the collection tool, not asked of the participant. */
export const OPTIONAL_COLUMNS = ['response_id', 'submitted_at'] as const;

/** Every column an export may contain. Anything else rejects the file. */
export const ALLOWED_COLUMNS: readonly string[] = [
  ...OPTIONAL_COLUMNS,
  ...FIELD_DEFINITIONS.map((field) => field.name),
  CONSENT_COLUMN,
];

const AFFIRMATIVE_CONSENT = new Set(['yes', 'true', '1', 'y']);

const fieldByName = new Map<string, FieldDefinition>(
  FIELD_DEFINITIONS.map((field): [string, FieldDefinition] => [field.name, field]),
);

export function fieldDefinition(name: string): FieldDefinition | undefined {
  return fieldByName.get(name);
}

export function optionLabel(fieldName: string, value: string): string {
  const option = fieldByName.get(fieldName)?.options.find((entry) => entry.value === value);
  return option?.label ?? value;
}

/** A single validated response. Never leaves the pipeline or reaches a page. */
export type ValidResponse = {
  readonly responseId: string | null;
  readonly submittedOn: string | null;
  readonly answers: Readonly<Record<string, string>>;
};

/* -------------------------------------------------------------------------- */
/* CSV reading                                                                */
/* -------------------------------------------------------------------------- */

/**
 * An RFC 4180 reader: quoted fields, doubled quotes, embedded commas and line
 * breaks, CR/LF/CRLF, optional BOM. Written here rather than pulled in as a
 * dependency because the accepted grammar is small and fully specified, and a
 * parser is the wrong place to accept a surprise.
 */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let started = false;

  const endField = () => {
    row.push(field);
    field = '';
    started = true;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
    started = false;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text.charAt(index);

    if (quoted) {
      if (char === '"') {
        if (text.charAt(index + 1) === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && field === '') {
      quoted = true;
      started = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\r') {
      if (text.charAt(index + 1) === '\n') index += 1;
      endRow();
    } else if (char === '\n') {
      endRow();
    } else {
      field += char;
      started = true;
    }
  }

  // A trailing newline must not produce a phantom empty row.
  if (started || row.length > 0 || field !== '') endRow();

  return rows.filter((entry) => entry.length > 1 || (entry[0] ?? '') !== '');
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

export type RejectionReason =
  | 'unexpected_column'
  | 'missing_required_column'
  | 'column_count_mismatch'
  | 'missing_required_field'
  | 'invalid_value'
  | 'consent_not_given'
  | 'invalid_response_id'
  | 'duplicate_response_id'
  | 'invalid_submitted_at';

export type RejectionTally = {
  readonly reason: RejectionReason;
  /** The column at fault, where the reason is field-specific. */
  readonly field: string | null;
  readonly rows: number;
};

export type ValidationReport = {
  readonly contractVersion: string;
  /** Data rows read, excluding the header. */
  readonly inputRows: number;
  readonly validRows: number;
  readonly rejectedRows: number;
  /** File-level problems. Any one of these rejects every row. */
  readonly fatalErrors: readonly string[];
  readonly rejections: readonly RejectionTally[];
  /** Blank values per contract field, across all data rows. */
  readonly missingByField: Readonly<Record<string, number>>;
  readonly minimumRequired: number;
  readonly meetsMinimumSample: boolean;
};

export type ValidationResult = {
  readonly report: ValidationReport;
  /** Empty whenever the report has a fatal error. Never published. */
  readonly responses: readonly ValidResponse[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const RESPONSE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * A real day in the calendar, not merely four-two-two digits.
 *
 * `Date.parse('2026-02-31T00:00:00Z')` does not fail — it rolls the value
 * forward to 3 March and returns a number, so a shape check plus a parse
 * accepts a date that does not exist and, worse, silently reports a different
 * one. The round trip through UTC components is what actually rejects it.
 */
export function isCalendarDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isoDateOf(raw: string): string | null {
  if (!isCalendarDate(raw.slice(0, 10))) return null;
  if (ISO_DATE.test(raw)) return raw;
  if (!ISO_DATETIME.test(raw)) return null;

  /*
   * A date-time with no offset is read as UTC, not as the machine's local
   * time. `Date.parse` would use the local zone, which means the same export
   * would produce different fieldwork dates on a laptop in New York and a
   * build agent in UTC. An anonymous export states no zone; assuming one is
   * the only reproducible choice.
   */
  const normalised = raw.replace(' ', 'T');
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(normalised);
  const parsed = Date.parse(hasOffset ? normalised : `${normalised}Z`);
  if (Number.isNaN(parsed)) return null;

  // Only the date reaches any published output; the time of day is discarded.
  return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * Validate a parsed export against the contract.
 *
 * Rejections are counted by reason and column. The offending *value* is never
 * recorded, anywhere: a value that fails validation is exactly the value most
 * likely to contain something a participant should not have typed.
 */
export function validateResponses(rows: readonly (readonly string[])[]): ValidationResult {
  const fatalErrors: string[] = [];
  const tallies = new Map<
    string,
    { reason: RejectionReason; field: string | null; rows: number }
  >();
  const missingByField: Record<string, number> = {};
  for (const field of FIELD_DEFINITIONS) missingByField[field.name] = 0;
  missingByField[CONSENT_COLUMN] = 0;

  const countRejection = (reason: RejectionReason, field: string | null) => {
    const key = `${reason}:${field ?? ''}`;
    const existing = tallies.get(key);
    if (existing) existing.rows += 1;
    else tallies.set(key, { reason, field, rows: 1 });
  };

  const header = rows[0];
  const dataRows = rows.slice(1);

  const emptyReport = (): ValidationResult => ({
    report: {
      contractVersion: DATASET_CONTRACT_VERSION,
      inputRows: dataRows.length,
      validRows: 0,
      rejectedRows: dataRows.length,
      fatalErrors,
      rejections: [...tallies.values()].map((entry) => ({ ...entry })),
      missingByField,
      minimumRequired: MINIMUM_VALID_RESPONSES,
      meetsMinimumSample: false,
    },
    responses: [],
  });

  if (!header || header.length === 0) {
    fatalErrors.push('The export has no header row.');
    return emptyReport();
  }

  const columns = header.map((name) => name.trim().toLowerCase());

  const duplicateColumns = columns.filter((name, index) => columns.indexOf(name) !== index);
  if (duplicateColumns.length > 0) {
    fatalErrors.push(
      `Duplicate columns in the header: ${[...new Set(duplicateColumns)].join(', ')}.`,
    );
  }

  const unexpected = columns.filter((name) => !ALLOWED_COLUMNS.includes(name));
  if (unexpected.length > 0) {
    // The column *names* are safe to print — they are structure, not response
    // data — and naming them is the only way the owner can fix the export.
    fatalErrors.push(
      `Unexpected columns, which may carry personal data: ${unexpected.join(', ')}. ` +
        'Every row is rejected. Re-export with only the documented columns.',
    );
    countRejection('unexpected_column', unexpected[0] ?? null);
  }

  const required = [...FIELD_DEFINITIONS.map((field) => field.name), CONSENT_COLUMN];
  const missingColumns = required.filter((name) => !columns.includes(name));
  if (missingColumns.length > 0) {
    fatalErrors.push(`Missing required columns: ${missingColumns.join(', ')}.`);
    countRejection('missing_required_column', missingColumns[0] ?? null);
  }

  if (fatalErrors.length > 0) return emptyReport();

  const indexOf = (name: string) => columns.indexOf(name);
  const responses: ValidResponse[] = [];
  const seenIds = new Set<string>();
  let rejected = 0;

  for (const row of dataRows) {
    if (row.length !== columns.length) {
      countRejection('column_count_mismatch', null);
      rejected += 1;
      continue;
    }

    const cell = (name: string) => (row[indexOf(name)] ?? '').trim();

    // Missing counts are gathered for every data row, including rejected ones,
    // so the report shows which question people abandoned.
    for (const name of required) {
      if (cell(name) === '') missingByField[name] = (missingByField[name] ?? 0) + 1;
    }

    let rowRejected = false;
    const reject = (reason: RejectionReason, field: string | null) => {
      if (rowRejected) return;
      rowRejected = true;
      countRejection(reason, field);
    };

    const consent = cell(CONSENT_COLUMN).toLowerCase();
    if (!AFFIRMATIVE_CONSENT.has(consent)) reject('consent_not_given', CONSENT_COLUMN);

    const answers: Record<string, string> = {};
    for (const field of FIELD_DEFINITIONS) {
      const raw = cell(field.name);
      if (raw === '') {
        reject('missing_required_field', field.name);
        continue;
      }
      const normalised = raw.toLowerCase();
      const option = field.options.find((entry) => entry.value === normalised);
      if (!option) {
        reject('invalid_value', field.name);
        continue;
      }
      answers[field.name] = option.value;
    }

    let responseId: string | null = null;
    if (columns.includes('response_id')) {
      const raw = cell('response_id');
      if (raw !== '') {
        if (!RESPONSE_ID.test(raw)) {
          reject('invalid_response_id', 'response_id');
        } else if (seenIds.has(raw)) {
          reject('duplicate_response_id', 'response_id');
        } else {
          responseId = raw;
        }
      }
    }

    let submittedOn: string | null = null;
    if (columns.includes('submitted_at')) {
      const raw = cell('submitted_at');
      if (raw !== '') {
        submittedOn = isoDateOf(raw);
        if (submittedOn === null) reject('invalid_submitted_at', 'submitted_at');
      }
    }

    if (rowRejected) {
      rejected += 1;
      continue;
    }

    if (responseId !== null) seenIds.add(responseId);
    responses.push({ responseId, submittedOn, answers });
  }

  return {
    report: {
      contractVersion: DATASET_CONTRACT_VERSION,
      inputRows: dataRows.length,
      validRows: responses.length,
      rejectedRows: rejected,
      fatalErrors,
      rejections: [...tallies.values()]
        .map((entry) => ({ ...entry }))
        .sort((a, b) => b.rows - a.rows || a.reason.localeCompare(b.reason)),
      missingByField,
      minimumRequired: MINIMUM_VALID_RESPONSES,
      meetsMinimumSample: responses.length >= MINIMUM_VALID_RESPONSES,
    },
    responses,
  };
}

/**
 * Render the validation report for a terminal.
 *
 * Counts, reasons and column names only. No response row, no cell value, no
 * response ID — not even for a rejected row.
 */
export function formatValidationReport(report: ValidationReport): string {
  const lines: string[] = [
    `Dataset contract: ${report.contractVersion}`,
    `Rows read:        ${report.inputRows}`,
    `Valid:            ${report.validRows}`,
    `Rejected:         ${report.rejectedRows}`,
    `Minimum to publish: ${report.minimumRequired} — ${
      report.meetsMinimumSample ? 'met' : 'NOT met'
    }`,
  ];

  if (report.fatalErrors.length > 0) {
    lines.push('', 'File-level errors:');
    for (const error of report.fatalErrors) lines.push(`  - ${error}`);
  }

  if (report.rejections.length > 0) {
    lines.push('', 'Rejections by reason:');
    for (const entry of report.rejections) {
      lines.push(`  - ${entry.reason}${entry.field ? ` (${entry.field})` : ''}: ${entry.rows}`);
    }
  }

  const missing = Object.entries(report.missingByField).filter(([, count]) => count > 0);
  lines.push('', 'Blank values by field:');
  if (missing.length === 0) lines.push('  - none');
  for (const [field, count] of missing) lines.push(`  - ${field}: ${count}`);

  return lines.join('\n');
}

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

export type DistributionRow = {
  readonly value: string;
  readonly label: string;
  readonly count: number;
  readonly percent: number;
  readonly nonSubstantive: boolean;
};

export type Distribution = {
  readonly field: string;
  readonly question: string;
  /** `findings` drives the report body; `composition` describes the sample. */
  readonly section: 'findings' | 'composition';
  /** Respondents the percentages are calculated over. */
  readonly base: number;
  readonly baseLabel: string;
  readonly rows: readonly DistributionRow[];
  /** Present when the field offers a "Not sure"/"Other"/"Prefer not to say". */
  readonly denominatorNote: string | null;
};

export type CrossTabCell = {
  readonly value: string;
  readonly label: string;
  readonly count: number | null;
  readonly percent: number | null;
  readonly suppressed: boolean;
};

export type CrossTabSegment = {
  readonly value: string;
  readonly label: string;
  readonly base: number;
  readonly suppressed: boolean;
  readonly cells: readonly CrossTabCell[];
};

export type CrossTab = {
  readonly id: string;
  readonly title: string;
  readonly segmentField: string;
  readonly measureField: string;
  readonly segments: readonly CrossTabSegment[];
  readonly suppressedSegments: number;
  readonly suppressedCells: number;
};

export type BenchmarkSummary = {
  readonly contractVersion: string;
  readonly generatedAt: string;
  readonly totalValidResponses: number;
  readonly meetsMinimumSample: boolean;
  readonly minimumRequired: number;
  readonly fieldwork: { readonly start: string | null; readonly end: string | null };
  readonly rounding: { readonly decimals: number; readonly note: string };
  readonly suppression: { readonly threshold: number; readonly note: string };
  readonly distributions: readonly Distribution[];
  readonly crossTabs: readonly CrossTab[];
};

/** Half away from zero, at `PERCENT_DECIMALS`. */
export function roundPercent(count: number, base: number): number {
  if (base <= 0) return 0;
  const factor = 10 ** PERCENT_DECIMALS;
  return Math.round((count / base) * 100 * factor) / factor;
}

const FINDING_FIELDS: readonly string[] = [
  'usual_payment_terms',
  'usual_days_to_payment',
  'late_payment_frequency',
  'deposit_policy',
  'late_fee_policy',
  'reminder_timing',
  'invoice_creation_method',
];

function distributionFor(
  field: FieldDefinition,
  responses: readonly ValidResponse[],
): Distribution {
  const base = responses.length;
  const counts = new Map<string, number>();
  for (const response of responses) {
    const value = response.answers[field.name];
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const rows = field.options.map((option) => {
    const count = counts.get(option.value) ?? 0;
    return {
      value: option.value,
      label: option.label,
      count,
      percent: roundPercent(count, base),
      nonSubstantive: option.nonSubstantive === true,
    };
  });

  const nonSubstantive = rows.filter((row) => row.nonSubstantive);
  const denominatorNote =
    nonSubstantive.length > 0
      ? `Percentages are of all ${base} valid responses, including the ` +
        `${nonSubstantive.map((row) => `${row.count} who answered “${row.label}”`).join(' and ')}. ` +
        'Those answers are kept in the denominator rather than dropped.'
      : null;

  return {
    field: field.name,
    question: field.question,
    section: FINDING_FIELDS.includes(field.name) ? 'findings' : 'composition',
    base,
    baseLabel: `all ${base} valid responses`,
    rows,
    denominatorNote,
  };
}

/* -------------------------------------------------------------------------- */
/* Disclosure control                                                         */
/* -------------------------------------------------------------------------- */

/**
 * The attack this module defends against.
 *
 * A cross-tabulation is not published on its own. The report also publishes the
 * marginals — the distribution of the measure over the whole sample, and the
 * distribution of the segment field, which is every row total. Both are
 * findings in their own right and cannot be withheld. That gives a reader one
 * linear equation per row and one per column:
 *
 *     Σ_c cell[r][c] = rowTotal[r]        Σ_r cell[r][c] = colTotal[c]
 *
 * If a line has exactly one withheld cell, that cell is the total minus the
 * cells still shown. Hiding it is decoration. Worse, solving one cell can
 * leave a second line with a single unknown, so the leak propagates.
 *
 * `propagateKnownCells` is that attack, run as a solver: it repeatedly fills in
 * any line with exactly one unknown until nothing more can be derived. It is
 * used twice — by the aggregator to check its own output, and by the summary
 * schema to refuse a summary that leaks, whoever produced it.
 *
 * It models first-order propagation, which is the attack described above and
 * the standard first check. It does not model a full linear-programming attack
 * that narrows a cell to a range using non-negativity across many lines; a
 * benchmark of this size and sensitivity does not warrant that machinery, and
 * claiming otherwise would overstate what this code does.
 */
export type CrossTabConstraints = {
  readonly rowTotals: readonly number[];
  readonly colTotals: readonly number[];
  /** `null` where a cell is withheld. */
  readonly known: readonly (readonly (number | null)[])[];
};

export function propagateKnownCells(input: CrossTabConstraints): (number | null)[][] {
  const grid = input.known.map((row) => [...row]);
  const rowCount = grid.length;
  const colCount = grid[0]?.length ?? 0;

  let changed = true;
  while (changed) {
    changed = false;

    for (let r = 0; r < rowCount; r += 1) {
      const row = grid[r];
      const total = input.rowTotals[r];
      if (!row || total === undefined) continue;
      const unknown = row.reduce<number[]>(
        (acc, cell, c) => (cell === null ? [...acc, c] : acc),
        [],
      );
      if (unknown.length !== 1) continue;
      const c = unknown[0]!;
      row[c] = total - row.reduce<number>((sum, cell) => sum + (cell ?? 0), 0);
      changed = true;
    }

    for (let c = 0; c < colCount; c += 1) {
      const total = input.colTotals[c];
      if (total === undefined) continue;
      const unknown = grid.reduce<number[]>(
        (acc, row, r) => (row[c] === null ? [...acc, r] : acc),
        [],
      );
      if (unknown.length !== 1) continue;
      const r = unknown[0]!;
      const column = grid.reduce<number>((sum, row) => sum + (row[c] ?? 0), 0);
      grid[r]![c] = total - column;
      changed = true;
    }
  }

  return grid;
}

/**
 * Withhold cells until no row and no column has exactly one withheld cell.
 *
 * Primary suppression marks a cell holding 1–9 respondents, and every cell of a
 * segment with fewer than 10 respondents in total. Complementary suppression
 * then runs to a fixpoint in both directions. Once every line holds either no
 * withheld cell or at least two, the propagation above has nowhere to start.
 *
 * A zero is never chosen as the complementary cell while a non-zero one is
 * available: withholding a zero protects nobody and costs a real figure.
 */
function suppressCells(
  counts: readonly (readonly number[])[],
  rowTotals: readonly number[],
): boolean[][] {
  const masked = counts.map((row, r) =>
    row.map((count) => {
      const base = rowTotals[r] ?? 0;
      return base < SUPPRESSION_THRESHOLD || (count > 0 && count < SUPPRESSION_THRESHOLD);
    }),
  );

  const rowCount = counts.length;
  const colCount = counts[0]?.length ?? 0;

  const maskSmallest = (cells: readonly { r: number; c: number }[]): boolean => {
    const open = cells.filter(({ r, c }) => masked[r]?.[c] === false);
    if (open.length === 0) return false;
    const sorted = [...open].sort((a, b) => (counts[a.r]?.[a.c] ?? 0) - (counts[b.r]?.[b.c] ?? 0));
    const pick = sorted.find(({ r, c }) => (counts[r]?.[c] ?? 0) > 0) ?? sorted[0]!;
    const row = masked[pick.r];
    if (!row) return false;
    row[pick.c] = true;
    return true;
  };

  let changed = true;
  while (changed) {
    changed = false;

    for (let r = 0; r < rowCount; r += 1) {
      const line = Array.from({ length: colCount }, (_, c) => ({ r, c }));
      if (line.filter(({ c }) => masked[r]?.[c]).length === 1 && maskSmallest(line)) changed = true;
    }

    for (let c = 0; c < colCount; c += 1) {
      const line = Array.from({ length: rowCount }, (_, r) => ({ r, c }));
      if (line.filter(({ r }) => masked[r]?.[c]).length === 1 && maskSmallest(line)) changed = true;
    }
  }

  return masked;
}

/** Withheld cells a reader could still derive, with their true values. */
function leakedCells(
  counts: readonly (readonly number[])[],
  masked: readonly (readonly boolean[])[],
  rowTotals: readonly number[],
): { r: number; c: number }[] {
  const solved = propagateKnownCells({
    rowTotals,
    colTotals: (counts[0] ?? []).map((_, c) =>
      counts.reduce<number>((sum, row) => sum + (row[c] ?? 0), 0),
    ),
    known: counts.map((row, r) => row.map((count, c) => (masked[r]?.[c] ? null : count))),
  });

  const leaked: { r: number; c: number }[] = [];
  counts.forEach((row, r) => {
    row.forEach((count, c) => {
      // A derivable zero discloses nothing about anyone. A derivable 1–9 does.
      if (!masked[r]?.[c]) return;
      if (solved[r]?.[c] === null || solved[r]?.[c] === undefined) return;
      if (count > 0 && count < SUPPRESSION_THRESHOLD) leaked.push({ r, c });
    });
  });
  return leaked;
}

/**
 * Cross-tabulate `measureField` within `segmentField`.
 *
 * Suppression runs in two directions, because the report publishes both
 * marginals; see `propagateKnownCells` above for why one direction is not
 * enough. If anything is still derivable after the fixpoint — which would mean
 * a table too small to publish safely in any form — the whole table is
 * withheld rather than published with a hole in it.
 */
function crossTabFor(
  id: string,
  title: string,
  segmentField: FieldDefinition,
  measureField: FieldDefinition,
  responses: readonly ValidResponse[],
): CrossTab {
  const counts = segmentField.options.map((segmentOption) => {
    const inSegment = responses.filter(
      (response) => response.answers[segmentField.name] === segmentOption.value,
    );
    return measureField.options.map(
      (option) =>
        inSegment.filter((response) => response.answers[measureField.name] === option.value).length,
    );
  });

  const bases = counts.map((row) => row.reduce((total, count) => total + count, 0));
  let masked = suppressCells(counts, bases);

  if (leakedCells(counts, masked, bases).length > 0) {
    masked = counts.map((row) => row.map(() => true));
  }

  let suppressedSegments = 0;
  let suppressedCells = 0;

  const segments = segmentField.options.map((segmentOption, r) => {
    const base = bases[r] ?? 0;
    const segmentSuppressed = base < SUPPRESSION_THRESHOLD;
    if (segmentSuppressed) suppressedSegments += 1;

    const cells = measureField.options.map((option, c) => {
      const hidden = masked[r]?.[c] ?? true;
      if (hidden && !segmentSuppressed) suppressedCells += 1;
      return {
        value: option.value,
        label: option.label,
        count: hidden ? null : (counts[r]?.[c] ?? 0),
        percent: hidden ? null : roundPercent(counts[r]?.[c] ?? 0, base),
        suppressed: hidden,
      };
    });

    return {
      value: segmentOption.value,
      label: segmentOption.label,
      base,
      suppressed: segmentSuppressed,
      cells,
    };
  });

  return {
    id,
    title,
    segmentField: segmentField.name,
    measureField: measureField.name,
    segments,
    suppressedSegments,
    suppressedCells,
  };
}

function fieldOrThrow(name: string): FieldDefinition {
  const field = fieldByName.get(name);
  if (!field) throw new Error(`Unknown research field: ${name}`);
  return field;
}

/**
 * Build the publishable summary.
 *
 * Everything here is a count or a share of counts. There is deliberately no
 * mean, median or "average days to payment": `usual_days_to_payment` is a set
 * of ranges a participant chose from, not a number anyone measured, and
 * arithmetic on bucket midpoints would invent a precision the survey never had.
 */
export function aggregate(
  responses: readonly ValidResponse[],
  options: { readonly generatedAt?: string } = {},
): BenchmarkSummary {
  const dates = responses
    .map((response) => response.submittedOn)
    .filter((date): date is string => date !== null)
    .sort();

  return {
    contractVersion: DATASET_CONTRACT_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    totalValidResponses: responses.length,
    meetsMinimumSample: responses.length >= MINIMUM_VALID_RESPONSES,
    minimumRequired: MINIMUM_VALID_RESPONSES,
    fieldwork: { start: dates[0] ?? null, end: dates[dates.length - 1] ?? null },
    rounding: { decimals: PERCENT_DECIMALS, note: ROUNDING_NOTE },
    suppression: { threshold: SUPPRESSION_THRESHOLD, note: SUPPRESSION_NOTE },
    distributions: FIELD_DEFINITIONS.map((field) => distributionFor(field, responses)),
    crossTabs: [
      crossTabFor(
        'payment-terms-by-role',
        'Usual payment terms, by respondent role',
        fieldOrThrow('respondent_role'),
        fieldOrThrow('usual_payment_terms'),
        responses,
      ),
      crossTabFor(
        'late-payment-by-terms',
        'How often invoices are paid late, by usual payment terms',
        fieldOrThrow('usual_payment_terms'),
        fieldOrThrow('late_payment_frequency'),
        responses,
      ),
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* Public aggregate CSV                                                       */
/* -------------------------------------------------------------------------- */

export type AggregateCsvRow = {
  readonly table: string;
  readonly segment_value: string;
  readonly segment_label: string;
  readonly option_value: string;
  readonly option_label: string;
  readonly respondents: string;
  readonly percent: string;
  readonly denominator: string;
  readonly suppressed: string;
};

export const AGGREGATE_CSV_COLUMNS = [
  { header: 'table', key: 'table' },
  { header: 'segment_value', key: 'segment_value' },
  { header: 'segment_label', key: 'segment_label' },
  { header: 'option_value', key: 'option_value' },
  { header: 'option_label', key: 'option_label' },
  { header: 'respondents', key: 'respondents' },
  { header: 'percent', key: 'percent' },
  { header: 'denominator', key: 'denominator' },
  { header: 'suppressed', key: 'suppressed' },
] as const satisfies readonly { header: string; key: keyof AggregateCsvRow }[];

/**
 * Long-format rows for the downloadable aggregate file. Suppressed cells appear
 * with empty counts and `suppressed=yes`, so the file states what was withheld
 * rather than quietly omitting it.
 */
export function aggregateCsvRows(summary: BenchmarkSummary): AggregateCsvRow[] {
  const rows: AggregateCsvRow[] = [];

  for (const distribution of summary.distributions) {
    for (const row of distribution.rows) {
      rows.push({
        table: distribution.field,
        segment_value: 'all',
        segment_label: 'All valid responses',
        option_value: row.value,
        option_label: row.label,
        respondents: String(row.count),
        percent: row.percent.toFixed(PERCENT_DECIMALS),
        denominator: String(distribution.base),
        suppressed: 'no',
      });
    }
  }

  for (const crossTab of summary.crossTabs) {
    for (const segment of crossTab.segments) {
      for (const cell of segment.cells) {
        rows.push({
          table: crossTab.id,
          segment_value: segment.value,
          segment_label: segment.label,
          option_value: cell.value,
          option_label: cell.label,
          respondents: cell.count === null ? '' : String(cell.count),
          percent: cell.percent === null ? '' : cell.percent.toFixed(PERCENT_DECIMALS),
          denominator: segment.suppressed ? '' : String(segment.base),
          suppressed: cell.suppressed ? 'yes' : 'no',
        });
      }
    }
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Summary schema                                                             */
/* -------------------------------------------------------------------------- */

const distributionRowSchema = z.strictObject({
  value: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  percent: z.number().min(0).max(100),
  nonSubstantive: z.boolean(),
});

const distributionSchema = z.strictObject({
  field: z.string().min(1),
  question: z.string().min(1),
  section: z.enum(['findings', 'composition']),
  base: z.number().int().nonnegative(),
  baseLabel: z.string().min(1),
  rows: z.array(distributionRowSchema).min(1),
  denominatorNote: z.string().min(1).nullable(),
});

const crossTabSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1),
  segmentField: z.string().min(1),
  measureField: z.string().min(1),
  segments: z
    .array(
      z.strictObject({
        value: z.string().min(1),
        label: z.string().min(1),
        base: z.number().int().nonnegative(),
        suppressed: z.boolean(),
        cells: z.array(
          z.strictObject({
            value: z.string().min(1),
            label: z.string().min(1),
            count: z.number().int().nonnegative().nullable(),
            percent: z.number().min(0).max(100).nullable(),
            suppressed: z.boolean(),
          }),
        ),
      }),
    )
    .min(1),
  suppressedSegments: z.number().int().nonnegative(),
  suppressedCells: z.number().int().nonnegative(),
});

/**
 * The shape the report page will accept.
 *
 * `.strict()` throughout is the load-bearing part: a summary file that somehow
 * carried a response-level array, a free-text field or any other unexpected key
 * fails to parse rather than being rendered.
 */
export const benchmarkSummarySchema = z.strictObject({
  contractVersion: z.literal(DATASET_CONTRACT_VERSION),
  generatedAt: z.string().min(4),
  totalValidResponses: z.number().int().nonnegative(),
  meetsMinimumSample: z.boolean(),
  minimumRequired: z.number().int().positive(),
  fieldwork: z.strictObject({
    start: z.string().regex(ISO_DATE).nullable(),
    end: z.string().regex(ISO_DATE).nullable(),
  }),
  rounding: z.strictObject({ decimals: z.number().int(), note: z.string().min(1) }),
  suppression: z.strictObject({ threshold: z.number().int(), note: z.string().min(1) }),
  distributions: z.array(distributionSchema).min(1),
  crossTabs: z.array(crossTabSchema).min(1),
});

/* -------------------------------------------------------------------------- */
/* Publication gate                                                           */
/* -------------------------------------------------------------------------- */

export type BenchmarkVisibility =
  /** Real data, owner-approved: indexable, in the sitemap. */
  | 'published'
  /** Visible to the team off production only, noindexed, never in the sitemap. */
  | 'preview'
  /** Not reachable: the route returns a real 404. */
  | 'absent';

export type BenchmarkGate = {
  readonly visibility: BenchmarkVisibility;
  /** Non-null only when `visibility` is `published` or a validated preview. */
  readonly summary: BenchmarkSummary | null;
  /** Everything still standing between this build and publication. */
  readonly blockers: readonly string[];
  /** The recorded editorial review date, or null if none has been recorded. */
  readonly reviewedOn: string | null;
  /** How respondents were recruited, or null if that has not been recorded. */
  readonly fieldworkRecord: FieldworkRecord | null;
};

export type BenchmarkGateInput = {
  /** The parsed summary, or null when no validated export has been processed. */
  readonly summary: BenchmarkSummary | null;
  /** `features.researchBenchmarkPublished`. */
  readonly approved: boolean;
  /** `isProduction` from the site config. */
  readonly isProduction: boolean;
  /** Overrides `BENCHMARK_REVIEWED_ON`; present so the gate stays testable. */
  readonly reviewedOn?: string | null;
  /** Overrides `FIELDWORK_RECORD`; present so the gate stays testable. */
  readonly fieldwork?: FieldworkRecord | null;
};

/**
 * The date a human last read this report end to end and stood behind it.
 *
 * `null` until that review actually happens, and null blocks publication. It
 * is a checked-in constant rather than an environment variable because it is
 * an editorial fact about the text in this repository: it should move in a
 * commit, next to whatever was reviewed, and be visible in the history. It
 * lives here rather than beside the route constants so the publish command,
 * which Node loads directly, can read it.
 *
 * Format: `YYYY-MM-DD`.
 */
export const BENCHMARK_REVIEWED_ON: string | null = null;

/**
 * How the people in the sample were found, and whether they were paid.
 *
 * The report cannot state this from the data. An export of anonymous answers
 * says nothing about whether respondents came from a newsletter, a forum or a
 * paid panel — and that difference changes both what the sample is and what the
 * report is allowed to claim. So it is recorded here, by hand, before
 * publication, and `null` blocks the report the same way a missing review date
 * does.
 *
 * `recruitment` is printed verbatim in the methodology section, so write it as
 * a sentence a reader will see, naming the channel:
 *
 *   recruitment: 'Participants were recruited through the Prolific panel and
 *                 compensated for completing the survey.'
 *
 * `participantsWereCompensated` must agree with that sentence. It also drives
 * the limitation about paid panels, and it is cross-checked against
 * `PROVIDER_ASSURANCE.participationIsUnpaid` so the survey page and the report
 * cannot say opposite things about the same fieldwork.
 */
export type FieldworkRecord = {
  /** The date this record was written and reviewed. `YYYY-MM-DD`. */
  readonly recordedOn: string;
  /** Printed verbatim in the methodology. Names the channel. */
  readonly recruitment: string;
  /** True when participants were paid, credited or entered into a draw. */
  readonly participantsWereCompensated: boolean;
};

export const FIELDWORK_RECORD: FieldworkRecord | null = null;

/**
 * Reasons the report cannot publish, in the order an owner would fix them.
 *
 * Deliberately phrased as facts about this build. They are rendered verbatim on
 * the preview page, so a teammate opening it sees exactly what is outstanding
 * rather than an empty page they have to interpret.
 */
export function publicationBlockers(input: BenchmarkGateInput): string[] {
  const { summary, approved } = input;
  const reviewedOn = input.reviewedOn === undefined ? BENCHMARK_REVIEWED_ON : input.reviewedOn;
  const fieldwork = input.fieldwork === undefined ? FIELDWORK_RECORD : input.fieldwork;
  const blockers: string[] = [];

  if (summary === null) {
    blockers.push(
      'No validated aggregate summary exists. Run `pnpm research:build` against a real ' +
        'anonymized export once the owner supplies one.',
    );
  } else {
    if (summary.contractVersion !== DATASET_CONTRACT_VERSION) {
      blockers.push(
        `The summary was built against contract ${summary.contractVersion}, but this build ` +
          `expects ${DATASET_CONTRACT_VERSION}. Re-run \`pnpm research:build\`.`,
      );
    }
    if (!summary.meetsMinimumSample || summary.totalValidResponses < MINIMUM_VALID_RESPONSES) {
      blockers.push(
        `Only ${summary.totalValidResponses} valid responses. The publication floor is ` +
          `${MINIMUM_VALID_RESPONSES}.`,
      );
    }
    if (summary.fieldwork.start === null || summary.fieldwork.end === null) {
      blockers.push(
        'Fieldwork dates are missing from the summary. The report must display when the ' +
          'data was collected.',
      );
    }
    /*
     * A summary that reaches a page has already been through
     * `parseBenchmarkSummary`, which throws on any of these. The gate checks
     * again because it is also handed summaries directly — by the publish
     * command and by tests — and a figure that does not add up must never be
     * one flag away from publication.
     */
    for (const problem of summaryIntegrityProblems(summary)) {
      blockers.push(`The summary does not add up: ${problem}`);
    }
  }

  if (reviewedOn === null || !isCalendarDate(reviewedOn)) {
    blockers.push(
      'No editorial review date is recorded. Set BENCHMARK_REVIEWED_ON in ' +
        'lib/research/pipeline.ts to the date a person actually reviewed the finished report.',
    );
  }

  if (fieldwork === null) {
    blockers.push(
      'No fieldwork record exists. Set FIELDWORK_RECORD in lib/research/pipeline.ts to say how ' +
        'respondents were recruited and whether they were paid. The report states this in its ' +
        'methodology and cannot infer it from the data.',
    );
  } else {
    if (!isCalendarDate(fieldwork.recordedOn)) {
      blockers.push('The fieldwork record carries no valid date.');
    }
    if (fieldwork.recruitment.trim().length < 20) {
      blockers.push(
        'The fieldwork record does not describe how respondents were recruited. This sentence ' +
          'is printed in the methodology, so it has to name the channel.',
      );
    }
  }

  if (!approved) {
    blockers.push(
      'Owner approval of the findings, wording, methodology, limitations and publication ' +
        'date has not been recorded. Set NEXT_PUBLIC_RESEARCH_BENCHMARK_PUBLISHED=true only ' +
        'after that approval exists in writing.',
    );
  }

  return blockers;
}

export function benchmarkGate(input: BenchmarkGateInput): BenchmarkGate {
  const blockers = publicationBlockers(input);
  const reviewedOn = input.reviewedOn === undefined ? BENCHMARK_REVIEWED_ON : input.reviewedOn;
  const fieldworkRecord = input.fieldwork === undefined ? FIELDWORK_RECORD : input.fieldwork;

  if (blockers.length === 0) {
    return {
      visibility: 'published',
      summary: input.summary,
      blockers,
      reviewedOn,
      fieldworkRecord,
    };
  }

  /*
   * Production returns a real 404 rather than a soft "coming soon". This
   * repository has no preview authentication to hide behind, and an
   * unfinished research page on the canonical URL is the one thing that would
   * be genuinely hard to undo: it can be crawled, cached and cited before the
   * real report exists.
   */
  if (input.isProduction) {
    return { visibility: 'absent', summary: null, blockers, reviewedOn, fieldworkRecord };
  }

  return { visibility: 'preview', summary: input.summary, blockers, reviewedOn, fieldworkRecord };
}

/* -------------------------------------------------------------------------- */
/* Semantic integrity                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Everything the shape check cannot see.
 *
 * `benchmarkSummarySchema` proves a summary has the right keys and the right
 * types. It says nothing about whether the numbers agree with each other: a
 * base of 999 beside a sample of 124, a percentage that does not match its own
 * count, a withheld cell that is derivable anyway — all of those are
 * well-formed JSON. This is the arithmetic audit, run on every parse, so a
 * stale, hand-edited or maliciously supplied summary cannot be rendered.
 *
 * It returns problems rather than throwing so the same function can be used by
 * a test, by the schema and by the publish command.
 */
export function summaryIntegrityProblems(summary: BenchmarkSummary): string[] {
  const problems: string[] = [];
  const total = summary.totalValidResponses;

  const check = (condition: boolean, message: string) => {
    if (!condition) problems.push(message);
  };

  check(
    summary.minimumRequired === MINIMUM_VALID_RESPONSES,
    'minimumRequired does not match the contract',
  );
  check(
    summary.meetsMinimumSample === total >= summary.minimumRequired,
    'meetsMinimumSample contradicts totalValidResponses',
  );
  check(
    summary.rounding.decimals === PERCENT_DECIMALS,
    'rounding.decimals does not match the contract',
  );
  check(
    summary.suppression.threshold === SUPPRESSION_THRESHOLD,
    'suppression.threshold does not match the contract',
  );

  const { start, end } = summary.fieldwork;
  check((start === null) === (end === null), 'fieldwork has one date and not the other');
  if (start !== null) check(isCalendarDate(start), `fieldwork.start is not a real date: ${start}`);
  if (end !== null) check(isCalendarDate(end), `fieldwork.end is not a real date: ${end}`);
  if (start !== null && end !== null) check(start <= end, 'fieldwork.start is after fieldwork.end');

  /* Distributions: one per contract field, in contract order, arithmetic sound. */
  check(
    summary.distributions.map((entry) => entry.field).join(',') ===
      FIELD_DEFINITIONS.map((field) => field.name).join(','),
    'distributions do not match the field contract',
  );

  for (const distribution of summary.distributions) {
    const field = fieldByName.get(distribution.field);
    const where = `distribution ${distribution.field}`;
    if (!field) {
      problems.push(`${where} is not a contract field`);
      continue;
    }

    check(distribution.question === field.question, `${where} has the wrong question text`);
    check(
      distribution.base === total,
      `${where} has a base of ${distribution.base} against a sample of ${total}`,
    );
    check(
      distribution.section === (FINDING_FIELDS.includes(field.name) ? 'findings' : 'composition'),
      `${where} is filed under the wrong section`,
    );
    check(
      distribution.rows.map((row) => row.value).join(',') ===
        field.options.map((option) => option.value).join(','),
      `${where} does not list the contract's options`,
    );

    for (const row of distribution.rows) {
      const option = field.options.find((entry) => entry.value === row.value);
      if (!option) continue;
      check(row.label === option.label, `${where} relabels ${row.value}`);
      check(
        row.nonSubstantive === (option.nonSubstantive === true),
        `${where} mis-flags ${row.value}`,
      );
      check(row.count <= distribution.base, `${where} counts more ${row.value} than its base`);
      check(
        row.percent === roundPercent(row.count, distribution.base),
        `${where} percentage for ${row.value} does not match its count`,
      );
    }

    const counted = distribution.rows.reduce((sum, row) => sum + row.count, 0);
    check(
      counted === distribution.base,
      `${where} counts ${counted} answers against a base of ${distribution.base}`,
    );
  }

  /* Cross-tabulations: consistent with their own marginals, and not derivable. */
  for (const crossTab of summary.crossTabs) {
    const where = `cross-tab ${crossTab.id}`;
    const segmentField = fieldByName.get(crossTab.segmentField);
    const measureField = fieldByName.get(crossTab.measureField);
    if (!segmentField || !measureField) {
      problems.push(`${where} names a field that is not in the contract`);
      continue;
    }

    check(
      crossTab.segments.map((segment) => segment.value).join(',') ===
        segmentField.options.map((option) => option.value).join(','),
      `${where} does not list every segment`,
    );

    const segmentTotal = crossTab.segments.reduce((sum, segment) => sum + segment.base, 0);
    check(
      segmentTotal === total,
      `${where} segments sum to ${segmentTotal} against a sample of ${total}`,
    );

    let suppressedSegments = 0;
    let suppressedCells = 0;

    for (const segment of crossTab.segments) {
      const segmentWhere = `${where}/${segment.value}`;
      check(
        segment.suppressed === segment.base < SUPPRESSION_THRESHOLD,
        `${segmentWhere} is flagged inconsistently with its base`,
      );
      if (segment.suppressed) suppressedSegments += 1;

      check(
        segment.cells.map((cell) => cell.value).join(',') ===
          measureField.options.map((option) => option.value).join(','),
        `${segmentWhere} does not list every answer`,
      );

      let shown = 0;
      for (const cell of segment.cells) {
        const cellWhere = `${segmentWhere}/${cell.value}`;
        check(
          cell.suppressed === (cell.count === null),
          `${cellWhere} is flagged inconsistently with its count`,
        );
        check(
          (cell.count === null) === (cell.percent === null),
          `${cellWhere} publishes a percentage without a count, or the reverse`,
        );
        if (cell.suppressed) {
          if (!segment.suppressed) suppressedCells += 1;
          continue;
        }
        if (segment.suppressed)
          problems.push(`${cellWhere} is published inside a withheld segment`);
        const count = cell.count ?? 0;
        check(
          count === 0 || count >= SUPPRESSION_THRESHOLD,
          `${cellWhere} publishes ${count} respondents, below the threshold`,
        );
        check(
          cell.percent === roundPercent(count, segment.base),
          `${cellWhere} percentage does not match its count`,
        );
        shown += count;
      }
      check(shown <= segment.base, `${segmentWhere} publishes more respondents than it has`);
    }

    check(
      crossTab.suppressedSegments === suppressedSegments,
      `${where} miscounts its withheld segments`,
    );
    check(crossTab.suppressedCells === suppressedCells, `${where} miscounts its withheld cells`);

    /*
     * The disclosure check, run against the marginals this same summary
     * publishes. If propagation fills in a withheld cell with a value below the
     * threshold, the suppression was decorative and the summary must not be
     * rendered — whatever produced it.
     */
    const marginal = summary.distributions.find((entry) => entry.field === measureField.name);
    if (marginal) {
      const solved = propagateKnownCells({
        rowTotals: crossTab.segments.map((segment) => segment.base),
        colTotals: measureField.options.map(
          (option) => marginal.rows.find((row) => row.value === option.value)?.count ?? 0,
        ),
        known: crossTab.segments.map((segment) => segment.cells.map((cell) => cell.count)),
      });

      crossTab.segments.forEach((segment, r) => {
        segment.cells.forEach((cell, c) => {
          if (!cell.suppressed) return;
          const derived = solved[r]?.[c];
          if (derived === null || derived === undefined) return;
          if (derived > 0 && derived < SUPPRESSION_THRESHOLD) {
            problems.push(
              `${where}/${segment.value}/${cell.value} is withheld but can be derived from the ` +
                'published totals',
            );
          }
        });
      });
    }
  }

  return problems;
}

export function parseBenchmarkSummary(input: unknown): BenchmarkSummary {
  const summary = benchmarkSummarySchema.parse(input) as BenchmarkSummary;

  const problems = summaryIntegrityProblems(summary);
  if (problems.length > 0) {
    throw new Error(
      `The benchmark summary is internally inconsistent:\n  - ${problems.join('\n  - ')}`,
    );
  }

  return summary;
}
