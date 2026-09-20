import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { CrossTabTable } from '@/components/research/cross-tab-table';
import { DistributionFigure } from '@/components/research/distribution-figure';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { features } from '@/lib/config/features';
import { absoluteUrl, site } from '@/lib/config/site';
import { REFERENCED_BLOG_POSTS } from '@/lib/registry/blog-posts';
import { benchmarkMetaDescription, keyFindings } from '@/lib/research/findings';
import {
  FIELD_DEFINITIONS,
  MINIMUM_VALID_RESPONSES,
  type BenchmarkSummary,
  type Distribution,
  type FieldworkRecord,
} from '@/lib/research/pipeline';
import {
  AGGREGATE_CSV_PATH,
  BENCHMARK_HEADING,
  BENCHMARK_PATH,
  BENCHMARK_TITLE,
} from '@/lib/research/publication';
import { benchmarkPublicationGate } from '@/lib/research/report';
import { buildMetadata } from '@/lib/seo/metadata';
import { datasetSchema } from '@/lib/seo/structured-data';

/**
 * The benchmark report.
 *
 * Until a validated export and a written owner approval both exist, this route
 * returns a real 404 in production and renders a clearly-marked preview
 * everywhere else. It never renders a number it did not get from
 * `data/research/aggregates/`, and there is no "coming soon" state on the
 * canonical URL: a research page that is crawled and cited before the research
 * exists is not a thing that can be taken back.
 */

const SOCIAL_IMAGE_PATH = `${BENCHMARK_PATH}/social-image`;

const NEUTRAL_DESCRIPTION =
  'A ToolNimbly research report on the payment terms small businesses put on their invoices ' +
  'and how long they wait to be paid. Not yet published.';

export async function generateMetadata(): Promise<Metadata> {
  const gate = benchmarkPublicationGate();

  if (gate.visibility === 'published' && gate.summary) {
    return buildMetadata({
      title: BENCHMARK_TITLE,
      description: benchmarkMetaDescription(gate.summary),
      path: BENCHMARK_PATH,
      image: SOCIAL_IMAGE_PATH,
      imageAlt: `${BENCHMARK_TITLE} — ToolNimbly research, ${gate.summary.totalValidResponses} valid responses`,
      type: 'article',
    });
  }

  return buildMetadata({
    title: BENCHMARK_TITLE,
    description: NEUTRAL_DESCRIPTION,
    path: BENCHMARK_PATH,
    image: SOCIAL_IMAGE_PATH,
    imageAlt: `${BENCHMARK_TITLE} — ToolNimbly research`,
    noIndex: true,
    type: 'article',
  });
}

export default function BenchmarkPage() {
  const gate = benchmarkPublicationGate();

  if (gate.visibility === 'absent') notFound();

  const { summary, reviewedOn, visibility } = gate;
  const published = visibility === 'published';

  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Research', path: '/research' },
          { name: BENCHMARK_TITLE, path: BENCHMARK_PATH },
        ]}
      />

      {!published ? <PreviewBanner blockers={gate.blockers} /> : null}

      <header className="mt-6">
        <h1 className="text-3xl font-bold sm:text-4xl">{BENCHMARK_HEADING}</h1>
        {summary ? (
          <p className="text-muted mt-3 text-lg">
            <strong className="text-foreground">{summary.totalValidResponses}</strong> valid
            responses, collected{' '}
            <strong className="text-foreground">
              {formatDate(summary.fieldwork.start)} to {formatDate(summary.fieldwork.end)}
            </strong>
            . A self-selected sample of people who send their own invoices — not a representative
            survey of small businesses.
          </p>
        ) : (
          <p className="text-muted mt-3 text-lg">
            This report has no data yet. Nothing below will show a figure until a validated survey
            export has been processed.
          </p>
        )}
      </header>

      {summary ? (
        <ReportBody
          summary={summary}
          published={published}
          reviewedOn={reviewedOn}
          fieldworkRecord={gate.fieldworkRecord}
        />
      ) : (
        <PlannedContents />
      )}
    </Container>
  );
}

function PreviewBanner({ blockers }: { blockers: readonly string[] }) {
  return (
    <div className="border-warning-border bg-warning-surface mt-4 rounded-lg border p-4">
      <p className="text-sm font-semibold">Preview — not published</p>
      <p className="mt-1 text-sm">
        This page is not reachable in production and is excluded from the sitemap. It is noindexed.
        Outstanding before it can publish:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {blockers.map((blocker) => (
          <li key={blocker}>{blocker}</li>
        ))}
      </ul>
    </div>
  );
}

function PlannedContents() {
  return (
    <section className="mt-10" aria-labelledby="planned-contents">
      <h2 id="planned-contents" className="text-2xl font-semibold">
        What this report will contain
      </h2>
      <p className="measure text-muted mt-3">
        The survey instrument, the data contract and the analysis are finished and tested. What is
        missing is responses. Once a validated export of at least {MINIMUM_VALID_RESPONSES}{' '}
        consented responses has been processed, this page will publish the distributions below, each
        as a chart and an equivalent table, with the methodology, limitations and a downloadable
        aggregate file.
      </p>
      <ul className="measure mt-4 list-disc space-y-1 pl-5 text-sm">
        {FIELD_DEFINITIONS.map((field) => (
          <li key={field.name}>{field.question}</li>
        ))}
      </ul>
      <p className="measure text-muted mt-4 text-sm">
        The specification is in{' '}
        <code className="text-xs">docs/research/invoice-payment-terms-survey-spec.md</code>.
      </p>
    </section>
  );
}

function ReportBody({
  summary,
  published,
  reviewedOn,
  fieldworkRecord,
}: {
  summary: BenchmarkSummary;
  published: boolean;
  reviewedOn: string | null;
  fieldworkRecord: FieldworkRecord | null;
}) {
  const findings = keyFindings(summary);
  const bySection = (section: Distribution['section']) =>
    summary.distributions.filter((entry) => entry.section === section);

  const findingSections: readonly { id: string; heading: string; fields: readonly string[] }[] = [
    {
      id: 'payment-terms',
      heading: 'The terms people put on an invoice',
      fields: ['usual_payment_terms'],
    },
    {
      id: 'payment-timing',
      heading: 'How long payment actually takes',
      fields: ['usual_days_to_payment'],
    },
    {
      id: 'late-payment',
      heading: 'How often invoices are paid late',
      fields: ['late_payment_frequency'],
    },
    {
      id: 'deposits-and-fees',
      heading: 'Deposits and late fees',
      fields: ['deposit_policy', 'late_fee_policy'],
    },
    { id: 'reminders', heading: 'Reminder practice', fields: ['reminder_timing'] },
    {
      id: 'creation-method',
      heading: 'How the invoice gets made',
      fields: ['invoice_creation_method'],
    },
  ];

  return (
    <>
      <section className="mt-10" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-2xl font-semibold">
          What the responses show
        </h2>
        <ul className="measure mt-4 space-y-3">
          {findings.map((finding) => (
            <li
              key={finding.id}
              className="border-border-default bg-surface rounded-lg border p-4 text-sm"
            >
              {finding.text}
            </li>
          ))}
        </ul>
        <p className="measure text-muted mt-3 text-sm">
          Each figure above is a count of answers to a single multiple-choice question. None of them
          describes a cause.
        </p>
      </section>

      {findingSections.map((section) => (
        <section key={section.id} className="mt-12" aria-labelledby={`${section.id}-heading`}>
          <h2 id={`${section.id}-heading`} className="text-2xl font-semibold">
            {section.heading}
          </h2>
          {section.fields.map((field) => {
            const distribution = summary.distributions.find((entry) => entry.field === field);
            if (!distribution) return null;
            return (
              <div key={field} className="mt-4">
                <h3 id={`${field}-heading`} className="text-base font-medium">
                  {distribution.question}
                </h3>
                <DistributionFigure distribution={distribution} headingId={`${field}-heading`} />
              </div>
            );
          })}
        </section>
      ))}

      <section className="mt-12" aria-labelledby="segments-heading">
        <h2 id="segments-heading" className="text-2xl font-semibold">
          Comparisons between groups
        </h2>
        <p className="measure text-muted mt-3 text-sm">{summary.suppression.note}</p>
        {summary.crossTabs.map((crossTab) => (
          <div key={crossTab.id} className="mt-6">
            <h3 className="text-base font-medium">{crossTab.title}</h3>
            <CrossTabTable crossTab={crossTab} />
          </div>
        ))}
      </section>

      <section className="mt-12" aria-labelledby="composition-heading">
        <h2 id="composition-heading" className="text-2xl font-semibold">
          Who answered
        </h2>
        <p className="measure text-muted mt-3 text-sm">
          The sample describes itself. These four questions are here so a reader can judge how much
          the figures above have to do with their own situation.
        </p>
        {bySection('composition').map((distribution) => (
          <div key={distribution.field} className="mt-6">
            <h3 id={`${distribution.field}-heading`} className="text-base font-medium">
              {distribution.question}
            </h3>
            <DistributionFigure
              distribution={distribution}
              headingId={`${distribution.field}-heading`}
            />
          </div>
        ))}
      </section>

      <section className="mt-12" aria-labelledby="methodology-heading">
        <h2 id="methodology-heading" className="text-2xl font-semibold">
          Methodology
        </h2>
        <div className="measure mt-3 space-y-3 text-sm">
          <p>
            An online, self-completed questionnaire of twelve multiple-choice questions, open to
            people who send invoices for a business they operate and who are at least 18 years old.
            Fieldwork ran from {formatDate(summary.fieldwork.start)} to{' '}
            {formatDate(summary.fieldwork.end)}. {summary.totalValidResponses} responses passed
            validation and are the basis of every figure on this page.
          </p>
          <p>
            {fieldworkRecord?.recruitment} Participation was voluntary, and every respondent gave an
            explicit consent to aggregate publication before answering. Responses carry no name,
            email address, client name, invoice content, revenue figure, bank detail, tax
            identifier, IP address or precise location, because none of those were ever asked for.
            Region was collected at continent level only.
          </p>
          <p>
            A response was discarded if consent was missing, if a required answer was blank, if any
            answer fell outside the documented options, or if its response identifier duplicated an
            earlier one. The full field contract is published in the repository as{' '}
            <code className="text-xs">docs/research/invoice-payment-terms-survey-spec.md</code>.
          </p>
          <p>
            <strong>Rounding.</strong> {summary.rounding.note}
          </p>
          <p>
            <strong>Small groups.</strong> {summary.suppression.note}
          </p>
          <p>
            <strong>No averages.</strong> Payment timing was asked as a set of ranges, so this
            report gives the share of respondents choosing each range. It does not state an average
            or median number of days, because no respondent was asked for a number of days.
          </p>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="limitations-heading">
        <h2 id="limitations-heading" className="text-2xl font-semibold">
          Limitations
        </h2>
        <ul className="measure mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            <strong>This is a convenience sample.</strong> Respondents chose to take part. They are
            not a random or weighted sample of any population, and nothing here should be read as
            representative of small businesses generally, of any country, or of any industry.
          </li>
          <li>
            <strong>{summary.totalValidResponses} responses is a small base.</strong> The
            publication floor for this report is {MINIMUM_VALID_RESPONSES} valid responses. That
            floor exists so the figures are not derived from a handful of people; it is not a claim
            of statistical significance, and no margin of error is quoted because none can be
            calculated for a self-selected sample.
          </li>
          {fieldworkRecord?.participantsWereCompensated ? (
            <li>
              <strong>Respondents were paid to take part.</strong> Compensating people is what makes
              a sample this size reachable at all, and it brings its own selection: the respondents
              are people who complete paid surveys, which is not the same population as people who
              answer an unpaid one, or as small businesses generally.
            </li>
          ) : null}
          <li>
            <strong>Answers are self-reported and remembered.</strong> Nobody checked a
            respondent&rsquo;s accounting records. &ldquo;How long you usually wait&rdquo; is what
            someone recalled about their own invoices, which need not match what their books would
            show. This survey has no way to tell which is closer, or in which direction any
            difference runs.
          </li>
          <li>
            <strong>Associations are not causes.</strong> Where one group differs from another, this
            report reports the difference and stops there. It does not claim that any payment term
            makes an invoice get paid faster or slower.
          </li>
          <li>
            <strong>Group comparisons are thin.</strong> Splitting a sample this size across eight
            payment terms and five roles leaves many cells below the reporting threshold, and those
            are withheld rather than shown.
          </li>
          <li>
            <strong>One point in time.</strong> This is a single wave with nothing to compare it to.
            There is no trend here, and none is claimed.
          </li>
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="definitions-heading">
        <h2 id="definitions-heading" className="text-2xl font-semibold">
          Definitions
        </h2>
        <dl className="measure mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-medium">Payment terms</dt>
            <dd className="text-muted">
              The deadline stated on an invoice. &ldquo;Net 30&rdquo; means payment is due 30 days
              after the invoice date; &ldquo;due on receipt&rdquo; means immediately.{' '}
              <ReadingLink post="invoicePaymentTerms">
                Each of these terms is explained in more detail
              </ReadingLink>
              .
            </dd>
          </div>
          <div>
            <dt className="font-medium">Late</dt>
            <dd className="text-muted">
              Paid after the due date stated on the invoice, as judged by the respondent. No grace
              period was defined for them.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Valid response</dt>
            <dd className="text-muted">
              A submission that gave consent, answered every required question, and used only the
              documented options.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Withheld</dt>
            <dd className="text-muted">
              A figure that exists but is not published because it represents fewer than{' '}
              {summary.suppression.threshold} respondents.
            </dd>
          </div>
          <div>
            <dt className="font-medium">Base</dt>
            <dd className="text-muted">
              The number of respondents a percentage is calculated over. Stated on every chart and
              table.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-12" aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-2xl font-semibold">
          Download the aggregate data
        </h2>
        <p className="measure text-muted mt-3 text-sm">
          Every published figure on this page, in one CSV: question, answer, respondent count,
          percentage, base, and a flag on each withheld cell. Individual responses are not included
          and are not published anywhere.
        </p>
        <p className="mt-4">
          <a
            href={AGGREGATE_CSV_PATH}
            download
            className="border-border-strong bg-surface hover:bg-surface-sunken inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium transition-colors"
          >
            Download the aggregate CSV
          </a>
        </p>
      </section>

      <section className="mt-12" aria-labelledby="citation-heading">
        <h2 id="citation-heading" className="text-2xl font-semibold">
          Citing this report
        </h2>
        <p className="measure text-muted mt-3 text-sm">
          Please cite the report rather than a screenshot of it, and link to the canonical URL so
          readers can check the base and the limitations for themselves.
        </p>
        <p className="border-border-default bg-surface-sunken measure mt-3 rounded-lg border p-4 text-sm">
          {BENCHMARK_HEADING}. {site.name}, {citationYear(reviewedOn, summary)}.{' '}
          {absoluteUrl(BENCHMARK_PATH)}
        </p>
        {reviewedOn ? (
          <p className="text-muted mt-3 text-sm">
            Last reviewed <time dateTime={reviewedOn}>{formatDate(reviewedOn)}</time>.
          </p>
        ) : null}
      </section>

      <section className="mt-12" aria-labelledby="next-heading">
        <h2 id="next-heading" className="text-2xl font-semibold">
          If you send invoices yourself
        </h2>
        <ul className="measure mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            Deciding what to put in the terms box is the practical version of this whole report.{' '}
            <ReadingLink post="invoicePaymentTerms">
              Due on receipt, Net 7, Net 15 and Net 30 compared
            </ReadingLink>{' '}
            walks through what each one asks of a customer.
          </li>
          <li>
            If you need to send something today, the{' '}
            <Link href="/tools/invoice-generator" className="hover:text-brand underline">
              invoice generator
            </Link>{' '}
            builds a PDF in the browser, and a{' '}
            <Link href="/tools/receipt-generator" className="hover:text-brand underline">
              receipt for a payment already made
            </Link>{' '}
            works the same way. Neither uploads anything.
          </li>
          <li>
            An invoice and a receipt do different jobs, and sending one in place of the other
            changes what a customer is being asked to do.{' '}
            <ReadingLink post="invoiceVsReceipt">
              The difference between an invoice and a receipt
            </ReadingLink>{' '}
            covers which one to send when.
          </li>
        </ul>
      </section>

      {published ? <BenchmarkJsonLd summary={summary} reviewedOn={reviewedOn} /> : null}
    </>
  );
}

/**
 * A link to a CMS-authored post, rendered only when the blog is switched on.
 *
 * With `NEXT_PUBLIC_BLOG_ENABLED` off, `/blog/*` is not built at all, so
 * linking unconditionally would put a 404 in a research report. The sentence
 * still reads without the link.
 */
function ReadingLink({
  post,
  children,
}: {
  post: keyof typeof REFERENCED_BLOG_POSTS;
  children: ReactNode;
}) {
  if (!features.blogEnabled) return <>{children}</>;
  return (
    <Link href={`/blog/${REFERENCED_BLOG_POSTS[post].slug}`} className="hover:text-brand underline">
      {children}
    </Link>
  );
}

function BenchmarkJsonLd({
  summary,
  reviewedOn,
}: {
  summary: BenchmarkSummary;
  reviewedOn: string | null;
}) {
  const published = reviewedOn ?? summary.generatedAt.slice(0, 10);
  const start = summary.fieldwork.start;
  const end = summary.fieldwork.end;
  if (!start || !end) return null;

  return (
    <JsonLd
      data={datasetSchema({
        name: BENCHMARK_HEADING,
        description:
          `Aggregate results from ${summary.totalValidResponses} valid responses to a ` +
          'self-completed survey of people who invoice for a business they operate, covering ' +
          'payment terms, payment timing, late payment, deposits, late fees, reminder practice ' +
          'and how invoices are created. Self-selected sample; not representative.',
        url: absoluteUrl(BENCHMARK_PATH),
        datePublished: published,
        dateModified: published,
        temporalCoverage: `${start}/${end}`,
        contentUrl: absoluteUrl(AGGREGATE_CSV_PATH),
        usageInfo: `${absoluteUrl(BENCHMARK_PATH)}#citation-heading`,
        variableMeasured: FIELD_DEFINITIONS.map((field) => field.name),
      })}
    />
  );
}

function citationYear(reviewedOn: string | null, summary: BenchmarkSummary): string {
  return (reviewedOn ?? summary.fieldwork.end ?? summary.generatedAt).slice(0, 4);
}

function formatDate(value: string | null): string {
  if (!value) return 'an unrecorded date';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
