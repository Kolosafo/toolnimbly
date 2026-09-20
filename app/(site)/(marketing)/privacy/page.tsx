import type { Metadata } from 'next';
import Link from 'next/link';

import { consentBannerRequired, features } from '@/lib/config/features';
import { surveyCollection } from '@/lib/research/survey';
import { site } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

import { LegalPage, Section } from '../legal-prose';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy',
  description:
    'What ToolNimbly collects, what it does not, and why your files and text never reach a server. Written in plain language, with the technical reasons included.',
  path: '/privacy',
});

export default function PrivacyPage() {
  /*
   * Every sentence in the survey section below is conditional on a fact
   * somebody verified about the provider, recorded in lib/research/survey.ts.
   * With no approved provider this whole section is absent, which is accurate:
   * nothing is being collected.
   */
  const collection = surveyCollection();

  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      updated="2026-09-20"
      showConfigurationNotice
      intro="The short version: the files and text you put into these tools are processed by your own browser and are never sent to us, because there is nowhere to send them."
    >
      <Section heading="What happens to the data you enter">
        <p>
          Every tool on this site runs entirely in your browser. When you compress an image, merge a
          PDF, generate a password or fill in an invoice, that work is performed by code running in
          your own tab using standard web APIs. The data is held in your device’s memory for as long
          as the page is open and is released when you reset the tool or close the tab.
        </p>
        <p>
          This product contains no file upload endpoint at all. There is no server-side processing
          of tool content, no temporary storage bucket, no queue, and no copy of your files
          anywhere. You can verify this yourself: open your browser’s developer tools, switch to the
          network panel, and use any tool. No request carrying your content is made.
        </p>
        <p>
          That covers, specifically: uploaded images and PDFs, text you paste into the counters or
          the case converter, the contents of QR codes including Wi-Fi passwords, generated
          passwords and UUIDs, dates of birth, height and weight, salary and loan figures, and every
          field of an invoice or receipt including your clients’ details.
        </p>
      </Section>

      {collection.live ? (
        <Section heading="Research survey responses">
          <p>
            There is one exception to everything above, and it is deliberately narrow: the{' '}
            <Link href="/research/invoice-payment-terms-survey">invoice payment terms survey</Link>.
            A survey has to transmit your answers, because the whole point is to count them
            alongside everyone else&rsquo;s. Nothing else on this site does that, and the tools
            described above are unaffected.
          </p>
          <p>
            <strong>What is collected.</strong> Twelve multiple-choice answers: the kind of business
            you operate, who you invoice, your continent, roughly how many invoices you send a
            month, your usual payment terms, how long you usually wait to be paid, how often you are
            paid late, your deposit and late-fee policies, when you send reminders, how you create
            invoices, and your consent to have those answers counted. Every one is a choice from a
            fixed list. There are no free-text boxes.
          </p>
          <p>
            <strong>What is not collected.</strong> No name, email address or phone number. No
            client or customer names. Nothing from an actual invoice, including amounts. No revenue
            figure, bank detail or tax identifier. Location is recorded only as a continent — never
            a city, postal code, address or coordinates. There is no mailing list, no marketing
            consent and no profile linking these answers to anything else you do on this site.
            {collection.assurance.storesNoIpWithResponses
              ? ' Your IP address is not stored alongside your answers.'
              : ''}
          </p>
          <p>
            <strong>Where it is processed.</strong> The questionnaire is hosted by{' '}
            {collection.provider}, which receives your answers directly; the survey page names them
            before you leave ToolNimbly. Their own privacy terms apply to the form itself. Their
            handling of the points in this section was checked on{' '}
            <time dateTime={collection.assurance.verifiedOn}>
              {collection.assurance.verifiedOn}
            </time>
            .
          </p>
          <p>
            <strong>What it is used for, and how long it is kept.</strong> Answers are aggregated
            into a public report — counts and percentages, with any group of fewer than ten
            respondents withheld. No individual response is published, made downloadable, or exposed
            through this website. The responses are deleted within{' '}
            {collection.assurance.rawRetentionDays} days of the report being published, and within{' '}
            {collection.assurance.unpublishedRawRetentionDays} days of the survey closing if the
            report is never published at all.
          </p>
          {collection.assurance.showsResponseIdOnConfirmation ? (
            <p>
              <strong>Deleting your response.</strong> Email{' '}
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with the identifier
              shown on the survey&rsquo;s confirmation screen and that response will be removed and
              the published figures regenerated. Without the identifier we genuinely cannot find
              your response, because it carries nothing that identifies you — and once the responses
              are deleted at the end of the period above, there is nothing left to remove.
            </p>
          ) : (
            <p>
              <strong>Deleting your response.</strong> A submitted response cannot be located again,
              by you or by us. It carries nothing that identifies you and the survey issues no
              identifier to quote, which is why the survey page asks you to decide before you submit
              rather than offering a withdrawal afterwards. Everything is deleted at the end of the
              period above regardless.
            </p>
          )}
        </Section>
      ) : null}

      <Section heading="Analytics">
        <p>
          ToolNimbly uses Cloudflare Web Analytics to understand aggregate page views and site
          performance. It works through a small browser beacon. User inputs, file contents,
          passwords, invoice fields and calculator inputs are not sent as analytics events.
        </p>
        <p>
          Cloudflare describes Web Analytics as privacy-first and says it does not collect or use
          visitors&apos; personal data. You can read{' '}
          <a
            href="https://developers.cloudflare.com/web-analytics/about/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Cloudflare&apos;s explanation of Web Analytics
          </a>
          . Standard requests for pages, assets and the performance beacon still travel through
          network and hosting infrastructure and may be processed there as ordinary technical
          traffic. They do not contain the values you enter into a tool or the contents of files you
          process locally.
        </p>
        {features.analyticsEnabled ? (
          <p>
            This deployment may also record broad tool actions through the configured{' '}
            {features.analyticsProvider} integration, subject to the controls described below. Its
            event format permits a tool identifier and a predefined action or error code—not raw
            inputs, pasted text, filenames, document contents, customer data or exact financial
            amounts.
          </p>
        ) : null}
      </Section>

      <Section heading="Cookies and local storage">
        {features.analyticsEnabled && features.analyticsProvider === 'ga4' ? (
          <p>
            Google Analytics may set analytics identifiers only after you choose “Allow analytics”.
            No Google script is requested before that choice. The site never sets advertising
            cookies.
          </p>
        ) : (
          <p>
            The ToolNimbly application does not load Google Analytics or advertising-cookie code
            under its current configuration. Cloudflare-controlled network behavior is governed by
            Cloudflare&apos;s service and site configuration rather than this application&apos;s
            optional analytics flag.
          </p>
        )}
        <p>Your browser’s local storage is used for these on-device preferences:</p>
        <ul>
          <li>
            <strong>Your theme preference</strong> — whether you chose light, dark or system. This
            is a single value and exists so the page does not flash the wrong theme when it loads.
          </li>
          <li>
            <strong>Invoice and receipt drafts</strong>, if you choose to enable draft saving. These
            are stored locally so you can come back to an unfinished document. There is a delete
            control for them on the tool, and clearing your browser’s site data removes them. They
            are not transmitted, backed up or recoverable by anyone else.
          </li>
          {features.analyticsEnabled && features.analyticsProvider === 'ga4' ? (
            <li>
              <strong>Your analytics choice</strong> — “allowed” or “denied”, so the site respects
              your decision on later visits without asking every time.
            </li>
          ) : null}
        </ul>
        {consentBannerRequired ? (
          <p>
            Because this deployment has advertising or profiling analytics enabled, a consent
            control is shown and your choice is respected before any such script loads.
          </p>
        ) : (
          <p>
            No in-app advertising or profiling integration is currently configured, so this
            application does not display its optional analytics consent banner.
          </p>
        )}
      </Section>

      <Section heading="Advertising">
        {features.adsEnabled ? (
          <p>
            This deployment displays advertising. Ad placements are clearly labelled, are never
            positioned where they could be mistaken for a download or an action button, and are
            never placed between a form and its primary control.
          </p>
        ) : (
          <p>
            There is no advertising on this site at present, and no ad network script is loaded. If
            advertising is introduced, it will be labelled, kept away from the working parts of each
            tool, and disclosed here — with any applicable consent controls in place beforehand.
          </p>
        )}
      </Section>

      <Section heading="Server logs">
        <p>
          Like any website, requests for pages and assets reach a hosting provider, which keeps
          standard technical logs — IP address, timestamp, the URL requested, user agent — for
          delivery and security purposes. These logs concern page requests only. They cannot contain
          the contents of your files or the values you typed into a tool, because that information
          is never part of a request.
        </p>
      </Section>

      <Section heading="Third parties">
        <p>
          Tool pages do not embed third-party resources. There are no external fonts, no embedded
          videos, no social widgets and no third-party APIs called during processing. The QR codes
          are generated by a local encoder rather than an image service, and PDF rendering uses a
          library running in your browser rather than a conversion API.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This site is a general-purpose utility and is not directed at children. It does not ask
          for a name, an email address or an account, and it collects no personal information for
          any user of any age.
        </p>
        {collection.live ? (
          <p>
            Taking part in the research survey requires you to be at least 18, which the survey
            states and asks you to confirm before the first question.
          </p>
        ) : null}
      </Section>

      <Section heading="Your rights and contact">
        <p>
          Because no personal data is collected or stored, there is generally no data for us to
          access, correct, export or delete on your behalf. Anything the tools retain lives in your
          own browser and is under your direct control through your browser’s settings.
        </p>
        {collection.live ? (
          <p>
            The research survey is the one place this site holds anything you submitted, and what it
            holds is a set of multiple-choice answers with nothing identifying attached. What can
            and cannot be done about those is described under “Research survey responses” above.
          </p>
        ) : null}
        <p>
          If you have a question about this policy or believe something on the site behaves
          differently from what is described here, email{' '}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. Please do not attach
          sensitive documents to that message — we do not need them, and we would rather they stayed
          with you. See the <Link href="/terms">terms</Link> for the conditions of use.
        </p>
      </Section>
    </LegalPage>
  );
}
