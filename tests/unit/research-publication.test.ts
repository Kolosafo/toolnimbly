import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { site } from '@/lib/config/site';
import { referencedBlogPostPaths, REFERENCED_BLOG_POSTS } from '@/lib/registry/blog-posts';
import { benchmarkMetaDescription, keyFindings } from '@/lib/research/findings';
import {
  FIELD_DEFINITIONS,
  MINIMUM_VALID_RESPONSES,
  aggregate,
  type BenchmarkSummary,
  type ValidResponse,
} from '@/lib/research/pipeline';
import { FIELDWORK_RECORD } from '@/lib/research/pipeline';
import {
  AGGREGATE_CSV_PATH,
  BENCHMARK_HEADING,
  BENCHMARK_PATH,
  BENCHMARK_REVIEWED_ON,
  SURVEY_PATH,
  benchmarkGate,
  publicationBlockers,
} from '@/lib/research/publication';
import { buildMetadata } from '@/lib/seo/metadata';
import { datasetSchema } from '@/lib/seo/structured-data';

/**
 * The publication gate, the report's metadata and its structured data
 * (task phases 6, 7, 10 and 11).
 */

const projectRoot = process.cwd();
const pageSource = readFileSync(
  join(projectRoot, 'app/(site)/research/invoice-payment-terms-benchmark-2026/page.tsx'),
  'utf8',
);

/**
 * Source with comments removed.
 *
 * These assertions are about what the page *renders*. A comment explaining why
 * there is no "coming soon" state would otherwise fail a check for exactly that
 * phrase, which would be an absurd reason to fail a build.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

function response(answers: Record<string, string>, submittedOn: string): ValidResponse {
  const filled: Record<string, string> = {};
  for (const field of FIELD_DEFINITIONS) {
    filled[field.name] = answers[field.name] ?? field.options[0]?.value ?? '';
  }
  return { responseId: null, submittedOn, answers: filled };
}

/** A summary that satisfies every data-side condition of the gate. */
function publishableSummary(count = MINIMUM_VALID_RESPONSES): BenchmarkSummary {
  return aggregate(
    Array.from({ length: count }, (_, index) =>
      response(
        {
          usual_payment_terms: index % 2 === 0 ? 'net_30' : 'net_15',
          usual_days_to_payment: index % 3 === 0 ? '31_45' : '15_30',
          late_payment_frequency: index % 4 === 0 ? 'about_half' : 'less_than_a_quarter',
          late_fee_policy: index % 2 === 0 ? 'do_not_state' : 'state_rarely_enforce',
          deposit_policy: index % 3 === 0 ? 'never' : 'sometimes',
        },
        index === 0 ? '2026-07-06' : '2026-07-29',
      ),
    ),
  );
}

const FIELDWORK = {
  recordedOn: '2026-08-03',
  recruitment:
    'Participants were recruited through the Prolific panel and compensated for completing ' +
    'the survey.',
  participantsWereCompensated: true,
} as const;

const APPROVED = {
  approved: true,
  reviewedOn: '2026-10-01',
  fieldwork: FIELDWORK,
} as const;

/* -------------------------------------------------------------------------- */

describe('the publication gate', () => {
  it('is shut in this repository today', () => {
    // The whole point of Release A: nothing is approved and nothing is published.
    expect(BENCHMARK_REVIEWED_ON).toBeNull();
    expect(FIELDWORK_RECORD).toBeNull();
    const blockers = publicationBlockers({
      summary: null,
      approved: false,
      isProduction: true,
    });
    expect(blockers.length).toBeGreaterThanOrEqual(4);
  });

  it('returns a real 404 in production while anything is outstanding', () => {
    const gate = benchmarkGate({ summary: null, approved: false, isProduction: true });
    expect(gate.visibility).toBe('absent');
    expect(gate.summary).toBeNull();
  });

  it('shows a marked preview off production instead of a 404', () => {
    const gate = benchmarkGate({ summary: null, approved: false, isProduction: false });
    expect(gate.visibility).toBe('preview');
    expect(gate.blockers.length).toBeGreaterThan(0);
  });

  it('refuses to publish real data without owner approval', () => {
    const gate = benchmarkGate({
      summary: publishableSummary(),
      approved: false,
      reviewedOn: '2026-10-01',
      fieldwork: FIELDWORK,
      isProduction: true,
    });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain('Owner approval');
  });

  it('refuses to publish approval without data', () => {
    const gate = benchmarkGate({ summary: null, isProduction: true, ...APPROVED });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain('No validated aggregate summary');
  });

  it('refuses to publish below the minimum sample size', () => {
    const gate = benchmarkGate({
      summary: publishableSummary(MINIMUM_VALID_RESPONSES - 1),
      isProduction: true,
      ...APPROVED,
    });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain(`floor is ${MINIMUM_VALID_RESPONSES}`);
  });

  it('refuses to publish without a recorded editorial review date', () => {
    const gate = benchmarkGate({
      summary: publishableSummary(),
      approved: true,
      reviewedOn: null,
      fieldwork: FIELDWORK,
      isProduction: true,
    });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain('editorial review date');
  });

  it('refuses to publish without knowing how respondents were recruited', () => {
    // An export of anonymous answers cannot say whether people came from a
    // newsletter or a paid panel, and the report has to state which.
    const gate = benchmarkGate({
      summary: publishableSummary(),
      approved: true,
      reviewedOn: '2026-10-01',
      fieldwork: null,
      isProduction: true,
    });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain('No fieldwork record exists');
  });

  it('refuses a fieldwork record that does not actually name a channel', () => {
    const gate = benchmarkGate({
      summary: publishableSummary(),
      approved: true,
      reviewedOn: '2026-10-01',
      fieldwork: { ...FIELDWORK, recruitment: 'Online.' },
      isProduction: true,
    });
    expect(gate.blockers.join(' ')).toContain('name the channel');
  });

  it('refuses a fieldwork record with no valid date', () => {
    const gate = benchmarkGate({
      summary: publishableSummary(),
      approved: true,
      reviewedOn: '2026-10-01',
      fieldwork: { ...FIELDWORK, recordedOn: '2026-02-31' },
      isProduction: true,
    });
    expect(gate.blockers.join(' ')).toContain('fieldwork record carries no valid date');
  });

  it('refuses to publish a summary built against another contract version', () => {
    const stale = { ...publishableSummary(), contractVersion: 'invoice-payment-terms-2026.v0' };
    const gate = benchmarkGate({ summary: stale, isProduction: true, ...APPROVED });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain('contract');
  });

  it('refuses to publish without fieldwork dates', () => {
    const undated = {
      ...publishableSummary(),
      fieldwork: { start: null, end: null },
    };
    const gate = benchmarkGate({ summary: undated, isProduction: true, ...APPROVED });
    expect(gate.visibility).toBe('absent');
    expect(gate.blockers.join(' ')).toContain('Fieldwork dates');
  });

  it('publishes once every condition holds', () => {
    const gate = benchmarkGate({
      summary: publishableSummary(150),
      isProduction: true,
      ...APPROVED,
    });
    expect(gate.visibility).toBe('published');
    expect(gate.blockers).toEqual([]);
    expect(gate.summary?.totalValidResponses).toBe(150);
    expect(gate.reviewedOn).toBe('2026-10-01');
    expect(gate.fieldworkRecord?.recruitment).toContain('Prolific');
  });
});

describe('report metadata', () => {
  const summary = publishableSummary(150);

  it('uses one self-referencing absolute canonical with no query string', () => {
    const metadata = buildMetadata({
      title: 'Invoice Payment Terms Benchmark 2026',
      description: benchmarkMetaDescription(summary),
      path: BENCHMARK_PATH,
      type: 'article',
    });

    expect(metadata.alternates?.canonical).toBe(`${site.url}${BENCHMARK_PATH}`);
    expect(String(metadata.alternates?.canonical)).not.toContain('?');
    expect(metadata.openGraph?.url).toBe(`${site.url}${BENCHMARK_PATH}`);
  });

  it('carries the exact title the brief asked for', () => {
    const metadata = buildMetadata({
      title: 'Invoice Payment Terms Benchmark 2026',
      description: 'x'.repeat(150),
      path: BENCHMARK_PATH,
    });
    expect(metadata.title).toEqual({
      absolute: 'Invoice Payment Terms Benchmark 2026 | ToolNimbly',
    });
  });

  it('writes a truthful description of 140–160 characters from the real numbers', () => {
    for (const count of [MINIMUM_VALID_RESPONSES, 124, 150, 212, 1500]) {
      const description = benchmarkMetaDescription(publishableSummary(count));
      expect(description.length, description).toBeGreaterThanOrEqual(140);
      expect(description.length, description).toBeLessThanOrEqual(160);
      expect(description).toContain(String(count));
    }
  });

  it('noindexes the report until it is published', () => {
    const metadata = buildMetadata({
      title: 'Invoice Payment Terms Benchmark 2026',
      description: 'y'.repeat(150),
      path: BENCHMARK_PATH,
      noIndex: true,
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: false });
  });

  it('keeps the survey page noindex but followed', () => {
    const metadata = buildMetadata({
      title: 'Invoice Payment Terms Survey',
      description: 'z'.repeat(150),
      path: SURVEY_PATH,
      noIndex: true,
      followWhenNoIndexed: true,
    });
    expect(metadata.robots).toMatchObject({ index: false, follow: true });
  });

  it('declares a 1200×630 social image with alt text', () => {
    const metadata = buildMetadata({
      title: 'Invoice Payment Terms Benchmark 2026',
      description: 'w'.repeat(150),
      path: BENCHMARK_PATH,
      image: `${BENCHMARK_PATH}/social-image`,
      imageAlt: 'Invoice Payment Terms Benchmark 2026 — ToolNimbly research',
    });

    const images = metadata.openGraph?.images;
    const image = Array.isArray(images) ? images[0] : images;
    expect(image).toMatchObject({
      url: `${BENCHMARK_PATH}/social-image`,
      width: 1200,
      height: 630,
    });
    expect((image as { alt: string }).alt).toContain('ToolNimbly research');
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});

describe('the report page source', () => {
  it('has exactly one H1', () => {
    expect(pageSource.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it('emits exactly one BreadcrumbList, through the shared component', () => {
    expect(pageSource.match(/<Breadcrumbs\b/g) ?? []).toHaveLength(1);
    expect(pageSource).not.toContain('breadcrumbSchema');
  });

  it('emits no FAQPage, despite having definitions and questions', () => {
    expect(pageSource).not.toContain('faqSchema');
    expect(pageSource).not.toContain('FAQPage');
  });

  it('links to both generators and both supporting articles', () => {
    expect(pageSource).toContain('href="/tools/invoice-generator"');
    expect(pageSource).toContain('href="/tools/receipt-generator"');
    expect(pageSource).toContain('invoicePaymentTerms');
    expect(pageSource).toContain('invoiceVsReceipt');
  });

  it('does not repeat one exact-match anchor over and over', () => {
    const anchors = [...pageSource.matchAll(/>\s*([^<>{}]{8,60}?)\s*<\/Link>/g)].map((match) =>
      match[1]?.trim(),
    );
    const counts = new Map<string, number>();
    for (const anchor of anchors) {
      if (!anchor) continue;
      counts.set(anchor, (counts.get(anchor) ?? 0) + 1);
    }
    for (const [anchor, count] of counts) {
      expect(count, `"${anchor}" is used as an anchor ${count} times`).toBeLessThanOrEqual(1);
    }
  });

  it('states recruitment from the reviewed record instead of assuming it', () => {
    expect(pageSource).toContain('fieldworkRecord?.recruitment');
    /*
     * The old text asserted nobody was paid, which a paid panel falsifies. The
     * word still appears once, in the paid-panel limitation contrasting this
     * sample with an unpaid one — that is a comparison, not a claim about who
     * answered, so the check is on the assertion forms rather than the word.
     */
    const flowed = withoutComments(pageSource).replace(/\s+/g, ' ');
    for (const claim of ['voluntary and unpaid', 'was unpaid', 'were unpaid', 'nobody was paid']) {
      expect(flowed, claim).not.toContain(claim);
    }
  });

  it('adds the paid-panel limitation only when respondents were paid', () => {
    expect(pageSource).toContain('fieldworkRecord?.participantsWereCompensated');
  });

  it('renders the download link and the citation block', () => {
    expect(pageSource).toContain('AGGREGATE_CSV_PATH');
    expect(pageSource).toContain('citation-heading');
    expect(pageSource).toContain('Last reviewed');
  });

  it('calls notFound() rather than rendering a placeholder in production', () => {
    expect(pageSource).toContain("gate.visibility === 'absent'");
    expect(pageSource).toContain('notFound()');
    expect(withoutComments(pageSource).toLowerCase()).not.toContain('coming soon');
  });

  it('emits its Dataset schema only when published', () => {
    expect(pageSource).toContain('{published ? <BenchmarkJsonLd');
  });
});

describe('Dataset structured data', () => {
  const summary = publishableSummary(150);
  const schema = datasetSchema({
    name: BENCHMARK_HEADING,
    description: 'Aggregate results from 150 valid responses.',
    url: `${site.url}${BENCHMARK_PATH}`,
    datePublished: '2026-10-01',
    dateModified: '2026-10-01',
    temporalCoverage: `${summary.fieldwork.start}/${summary.fieldwork.end}`,
    contentUrl: `${site.url}${AGGREGATE_CSV_PATH}`,
    usageInfo: `${site.url}${BENCHMARK_PATH}#citation-heading`,
    variableMeasured: FIELD_DEFINITIONS.map((field) => field.name),
  }) as Record<string, unknown>;

  it('describes the dataset accurately', () => {
    expect(schema['@type']).toBe('Dataset');
    expect(schema.name).toBe(BENCHMARK_HEADING);
    expect(schema.temporalCoverage).toBe('2026-07-06/2026-07-29');
    expect(schema.variableMeasured).toHaveLength(FIELD_DEFINITIONS.length);
  });

  it('points the distribution at the real public CSV', () => {
    const distribution = schema.distribution as { encodingFormat: string; contentUrl: string }[];
    expect(distribution[0]?.encodingFormat).toBe('text/csv');
    expect(distribution[0]?.contentUrl).toBe(`${site.url}${AGGREGATE_CSV_PATH}`);
  });

  it('claims no DOI, citation count, named author or geographic coverage', () => {
    // Key probes: `usageInfo` legitimately points at the page's own citation
    // section, and a bare substring match would read that URL as a claim.
    for (const forbidden of [
      'identifier',
      'citation',
      'sameAs',
      'doi',
      'spatialCoverage',
      'aggregateRating',
      'measurementTechnique',
    ]) {
      expect(Object.keys(schema), `Dataset must not claim ${forbidden}`).not.toContain(forbidden);
    }
    expect(JSON.stringify(schema)).not.toContain('doi.org');
    // The publisher is the organisation node, not an invented person.
    expect(schema.creator).toEqual({ '@id': `${site.url}/#organization` });
  });
});

describe('derived findings', () => {
  const summary = publishableSummary(150);
  const findings = keyFindings(summary);

  it('produces three to five findings', () => {
    expect(findings.length).toBeGreaterThanOrEqual(3);
    expect(findings.length).toBeLessThanOrEqual(5);
  });

  it('states a denominator in every finding', () => {
    for (const finding of findings) {
      expect(finding.text, finding.text).toMatch(/of \d+ respondents/);
    }
  });

  it('uses no causal or representativeness language', () => {
    const forbidden = [
      'causes',
      'caused',
      'leads to',
      'because of',
      'representative',
      'industry-wide',
      'statistically significant',
      'proves',
      'trend',
    ];
    const text = findings
      .map((finding) => finding.text)
      .join(' ')
      .toLowerCase();
    for (const phrase of forbidden) expect(text, phrase).not.toContain(phrase);
  });

  it('produces nothing at all from an empty sample', () => {
    expect(keyFindings(aggregate([]))).toEqual([]);
  });
});

describe('the whole feature avoids unsupportable claims', () => {
  const sources = [
    'app/(site)/research/invoice-payment-terms-benchmark-2026/page.tsx',
    'app/(site)/research/invoice-payment-terms-survey/page.tsx',
    'app/(site)/research/page.tsx',
    'components/research/distribution-figure.tsx',
    'components/research/cross-tab-table.tsx',
    'components/research/benchmark-callout.tsx',
    'lib/research/findings.ts',
    'lib/research/survey.ts',
  ].map((path) => ({ path, text: readFileSync(join(projectRoot, path), 'utf8') }));

  it('never calls the sample representative or significant', () => {
    const positiveClaims = [
      'statistically significant',
      'industry-wide',
      'nationally representative',
      'is representative',
      'are representative',
      'a representative sample',
      'representative of the industry',
      'margin of error of',
    ];

    for (const { path, text } of sources) {
      const lower = withoutComments(text).toLowerCase();
      for (const phrase of positiveClaims) {
        expect(lower, `${path} contains "${phrase}"`).not.toContain(phrase);
      }
      // Every mention of the word is a denial of it. Whitespace is collapsed
      // first, because JSX wraps a sentence across lines and the negation is
      // routinely on the line above the word it negates.
      const flowed = lower.replace(/\s+/g, ' ');
      for (const match of flowed.matchAll(/.{0,80}representative/g)) {
        expect(match[0], `${path}: unqualified "representative"`).toMatch(
          /\bnot\b|\bno\b|\bnothing\b|\bnever\b/,
        );
      }
    }
  });

  it('asserts nothing about the audience or the world that it cannot source', () => {
    /*
     * The report's own findings are computed from the summary, so they are
     * safe by construction. The prose around them is where an unsupported
     * statistic gets in — an audience claim with no analytics behind it, or a
     * confident "usually" about something nobody measured.
     */
    const unsourced = [
      'used mostly by',
      'most of our users',
      'most users',
      'surprisingly common',
      'studies show',
      'research shows',
      'it is well known',
      'everyone knows',
      'tend to be worse',
      'the most common reason',
      'on average, businesses',
    ];

    for (const { path, text } of sources) {
      const lower = withoutComments(text).replace(/\s+/g, ' ').toLowerCase();
      for (const phrase of unsourced) {
        expect(lower, `${path} asserts "${phrase}" with nothing behind it`).not.toContain(phrase);
      }
    }
  });

  it('makes no legal, tax or accounting claim', () => {
    for (const { path, text } of sources) {
      const lower = text.toLowerCase();
      for (const phrase of ['legally required', 'you must charge', 'tax advice', 'legal advice']) {
        expect(lower, `${path} contains "${phrase}"`).not.toContain(phrase);
      }
    }
  });
});

describe('links to CMS posts', () => {
  it('names the two supporting articles by slug in one place', () => {
    expect(REFERENCED_BLOG_POSTS.invoicePaymentTerms.slug).toBe(
      'invoice-payment-terms-explained-due-on-receipt-net-7-net-15-and-net-30',
    );
    expect(REFERENCED_BLOG_POSTS.invoiceVsReceipt.slug).toBe(
      'invoice-vs-receipt-what-is-the-difference-and-when-do-you-use-each',
    );
    expect(referencedBlogPostPaths()).toHaveLength(2);
  });

  it('renders them only when the blog is switched on', () => {
    // Otherwise `/blog/*` is not built and the report would carry two 404s.
    expect(pageSource).toContain('if (!features.blogEnabled) return <>{children}</>;');
  });
});
