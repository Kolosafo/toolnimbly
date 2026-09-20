import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

import { LegalPage, Section } from '../legal-prose';

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description:
    'How to report a bug, a wrong calculation, an accessibility problem or a security issue in ToolNimbly, and what to include so it can be fixed quickly.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <LegalPage
      title="Contact"
      path="/contact"
      intro="There is no contact form here, because a form would mean sending your message through a server — and this site is built not to do that. Email works better anyway."
    >
      <Section heading="Email">
        <p>
          Write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. It is read by a
          person, and messages about a broken calculation or an accessibility problem are
          prioritised.
        </p>
      </Section>

      <Section heading="Reporting a wrong result">
        <p>
          This is the most useful kind of message we can receive. To investigate quickly, please
          include:
        </p>
        <ul>
          <li>which tool, by name or URL;</li>
          <li>the exact values you entered, and the settings you had selected;</li>
          <li>the result you got and the result you expected;</li>
          <li>your browser and version, if you know them.</li>
        </ul>
        <p>
          Where a report shows a genuine error, the fix is accompanied by a regression test so the
          same mistake cannot return.
        </p>
      </Section>

      <Section heading="Accessibility">
        <p>
          If any part of this site is difficult or impossible to use with a keyboard, a screen
          reader, magnification or high-contrast mode, please say so. Describe what you were trying
          to do, what happened instead, and which assistive technology you were using. Accessibility
          defects are treated as functional defects, not enhancements.
        </p>
      </Section>

      <Section heading="Security">
        <p>
          Report suspected vulnerabilities to the same address with “Security” in the subject line.
          Please include enough detail to reproduce the issue, and give us a reasonable opportunity
          to fix it before disclosing it publicly.
        </p>
        <p>
          Please do not send us files containing real personal, financial or medical data as part of
          a report. Sample files that demonstrate the problem without real data are both safer and
          more useful. If a specific file triggers a bug, describe its characteristics — size, page
          count, format, how it was created — rather than sending the file itself.
        </p>
      </Section>

      <Section heading="What we cannot help with">
        <p>
          We cannot recover a document, a draft or a generated file. Nothing you create here is
          stored on a server, so there is no copy for us to retrieve — that is the same property
          that keeps your data private. We also cannot give financial, medical, tax or legal advice;
          see the <Link href="/terms">terms</Link> for what these tools are and are not.
        </p>
      </Section>
    </LegalPage>
  );
}
