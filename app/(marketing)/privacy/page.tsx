import type { Metadata } from 'next';
import Link from 'next/link';

import { consentBannerRequired, features } from '@/lib/config/features';
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
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      updated="2026-09-16"
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

      <Section heading="Analytics">
        {features.analyticsEnabled ? (
          <>
            <p>
              Anonymous, aggregate usage analytics are enabled on this deployment using{' '}
              {features.analyticsProvider}. They record which pages are viewed and which broad
              actions occur — that a tool was opened, that a calculation succeeded, that a download
              happened.
            </p>
            <p>
              They never record the values you enter. The event format permits only a tool
              identifier and a predefined code from a fixed list. Raw inputs, pasted text,
              passwords, generated UUIDs, filenames, file contents, invoice or customer data, QR
              code contents, dates of birth, body measurements and exact financial amounts are all
              excluded by design, not by policy.
            </p>
          </>
        ) : (
          <>
            <p>
              There are currently no analytics running on this site. No usage events are collected,
              no page views are recorded and no third-party analytics script is loaded.
            </p>
            <p>
              If privacy-respecting analytics are enabled in future, this section will be updated
              before they are switched on, and the rules above will apply: event names and a tool
              identifier only, never the values you enter.
            </p>
          </>
        )}
      </Section>

      <Section heading="Cookies and local storage">
        <p>
          This site sets no tracking cookies and no advertising cookies. It uses your browser’s
          local storage for two things only, both of which stay on your device and are never
          transmitted:
        </p>
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
        </ul>
        {consentBannerRequired ? (
          <p>
            Because this deployment has advertising or profiling analytics enabled, a consent
            control is shown and your choice is respected before any such script loads.
          </p>
        ) : (
          <p>
            Because nothing here profiles you or sets a tracking identifier, there is no consent
            banner to click through.
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
          This site is a general-purpose utility and is not directed at children. It does not ask for
          a name, an email address or an account, and it collects no personal information for any
          user of any age.
        </p>
      </Section>

      <Section heading="Your rights and contact">
        <p>
          Because no personal data is collected or stored, there is generally no data for us to
          access, correct, export or delete on your behalf. Anything the tools retain lives in your
          own browser and is under your direct control through your browser’s settings.
        </p>
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
