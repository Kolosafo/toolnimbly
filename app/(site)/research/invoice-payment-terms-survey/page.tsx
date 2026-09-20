import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Container } from '@/components/ui/container';
import { FIELD_DEFINITIONS, MINIMUM_VALID_RESPONSES } from '@/lib/research/pipeline';
import { RESEARCH_INDEX_PATH, SURVEY_PATH } from '@/lib/research/publication';
import { surveyCollection } from '@/lib/research/survey';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * The survey landing page.
 *
 * It 404s unless the survey is switched on, pointed at a configured provider
 * URL, *and* backed by a recorded provider assurance. A landing page whose only
 * button goes nowhere is worse than no landing page, and a page that promises
 * things about a provider nobody checked is worse than either.
 *
 * Several sentences below are conditional on a specific verified fact. Where
 * one has not been verified, the sentence is absent rather than hedged — a
 * qualified promise is still a promise.
 *
 * `noindex, follow` while collection runs: this page is useful to a person who
 * has been sent here and useless in a search result, but its links onward to
 * the privacy policy and the tools should still be followed. Indexing it needs
 * explicit owner approval, and it is not in the sitemap either way.
 */

const DESCRIPTION =
  'Take part in ToolNimbly’s anonymous research on invoice payment terms and how long ' +
  'small businesses wait to be paid. Twelve multiple-choice questions, about three minutes.';

export const metadata: Metadata = buildMetadata({
  title: 'Invoice Payment Terms Survey',
  description: DESCRIPTION,
  path: SURVEY_PATH,
  noIndex: true,
  followWhenNoIndexed: true,
});

export default function SurveyLandingPage() {
  const collection = surveyCollection();
  if (!collection.live) notFound();

  const { provider, url, assurance } = collection;

  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Research', path: RESEARCH_INDEX_PATH },
          { name: 'Invoice payment terms survey', path: SURVEY_PATH },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Invoice payment terms survey</h1>
        <p className="measure text-muted mt-3 text-lg">
          Twelve multiple-choice questions about the terms you put on an invoice and how long you
          actually wait to be paid. About three minutes. Nothing to type.
        </p>
      </header>

      <div className="border-brand-border bg-brand-surface measure mt-6 rounded-lg border p-4">
        <p className="text-sm">
          ToolNimbly is collecting anonymous, aggregate information about invoice payment terms and
          payment timing for a public research report. Do not enter names, email addresses, client
          information, invoice contents, account details, tax identifiers, or other personal or
          confidential information. Survey responses are submitted for aggregation and are not
          processed only on your device. Participation is voluntary. Results may be published only
          in aggregate, and small groups will be suppressed.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="transmitted-heading">
        <h2 id="transmitted-heading" className="text-2xl font-semibold">
          This is the one thing on this site that is sent somewhere
        </h2>
        <div className="measure mt-3 space-y-3 text-sm">
          <p>
            Every tool on ToolNimbly runs in your browser. Your files, your invoice fields, your
            calculator inputs — none of it is uploaded, because there is nowhere to upload it to.
          </p>
          <p>
            <strong>A survey cannot work that way.</strong> Your answers have to be transmitted so
            they can be counted with everyone else&rsquo;s. That makes this page an exception to the
            local-processing promise the rest of the site keeps, and it would be dishonest not to
            say so before you start. What we collect and how long we keep it is in the{' '}
            <Link href="/privacy" className="hover:text-brand underline">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="what-heading">
        <h2 id="what-heading" className="text-2xl font-semibold">
          What is asked, and what is not
        </h2>
        <h3 className="mt-4 text-base font-medium">The questions</h3>
        <ul className="measure mt-2 list-disc space-y-1 pl-5 text-sm">
          {FIELD_DEFINITIONS.map((field) => (
            <li key={field.name}>{field.question}</li>
          ))}
        </ul>
        <p className="measure text-muted mt-3 text-sm">
          Every one is multiple choice. There is no free-text box, so there is nowhere to
          accidentally type something you did not mean to share.
        </p>

        <h3 className="mt-6 text-base font-medium">What is never asked</h3>
        <p className="measure mt-2 text-sm">
          Your name, email address or phone number. Your clients&rsquo; names. Anything from an
          actual invoice, including amounts. Revenue, bank details or tax identifiers. Location is
          asked only as a continent — never a city, postal code or anything finer.
          {assurance.storesNoIpWithResponses
            ? ' Your IP address is not stored alongside your answers.'
            : ''}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="eligibility-heading">
        <h2 id="eligibility-heading" className="text-2xl font-semibold">
          Who it is for
        </h2>
        <ul className="measure mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>
            You send invoices for a business you operate — freelance, sole trader, agency, or a
            small company of your own.
          </li>
          <li>You are at least 18 years old.</li>
          <li>
            You are happy for your answers to be counted into published totals. You are asked to
            confirm that before the first question, and you cannot submit without it.
          </li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="results-heading">
        <h2 id="results-heading" className="text-2xl font-semibold">
          What happens to your answers
        </h2>
        <div className="measure mt-3 space-y-3 text-sm">
          <p>
            They are counted. Nothing else. The report publishes how many people chose each option,
            and any group smaller than 10 respondents is withheld rather than shown. No individual
            response is published, downloadable, or reachable through this website.
          </p>
          <p>
            The report will not be published at all unless at least {MINIMUM_VALID_RESPONSES} valid
            responses come in. If that does not happen — or if the report is shelved for any other
            reason — the responses are deleted within {assurance.unpublishedRawRetentionDays} days
            of the survey closing, and nothing is published. If the report does publish, the
            responses behind it are deleted within {assurance.rawRetentionDays} days of that date.
          </p>
          {assurance.showsResponseIdOnConfirmation ? (
            <p>
              When you submit, the confirmation screen shows an identifier. Keep it if you might
              want your response removed: it is the only way to find your answers again, because
              they carry nothing else that points to you. Once the responses are deleted at the end
              of the period above, there is nothing left to remove.
            </p>
          ) : (
            <p>
              Your answers carry nothing that identifies you, and this survey gives you no
              identifier to quote afterwards. That means a submitted response cannot be located
              again, by you or by us, so it cannot be individually withdrawn. Please decide before
              you submit.
            </p>
          )}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="start-heading">
        <h2 id="start-heading" className="text-2xl font-semibold">
          Take the survey
        </h2>
        <p className="measure mt-3 text-sm">
          The questionnaire is hosted by <strong>{provider}</strong>, not on ToolNimbly. Following
          this link takes you to {provider}, where their own terms and privacy policy apply to the
          page you land on.
        </p>
        <p className="mt-4">
          <a
            href={url}
            rel="noopener noreferrer"
            className="bg-brand text-brand-contrast hover:bg-brand-hover inline-flex min-h-12 items-center rounded-md px-5 text-base font-medium transition-colors"
          >
            Start the survey on {provider}
          </a>
        </p>
        <p className="text-muted mt-3 text-sm">
          Participation is voluntary{assurance.participationIsUnpaid ? ' and unpaid' : ''}.
          {assurance.recordsNothingBeforeSubmit
            ? ' You can close the form at any point before submitting, and nothing is recorded.'
            : ''}
        </p>
      </section>
    </Container>
  );
}
