import type { Metadata } from 'next';
import Link from 'next/link';

import { site } from '@/lib/config/site';
import { buildMetadata } from '@/lib/seo/metadata';

import { LegalPage, Section } from '../legal-prose';

export const metadata: Metadata = buildMetadata({
  title: 'Terms of Use',
  description:
    'The conditions for using ToolNimbly, what the tools are and are not warranted to do, and the health, financial and tax disclaimers that apply to specific tools.',
  path: '/terms',
});

export default function TermsPage() {
  const entity = site.legalEntity || site.name;

  return (
    <LegalPage
      title="Terms of Use"
      path="/terms"
      updated="2026-09-16"
      showConfigurationNotice
      intro={`These terms govern your use of ${site.name}. Using the site means you accept them.`}
    >
      <Section heading="What this service is">
        <p>
          {site.name} provides free browser-based utilities. No account is required, nothing is
          charged, and the tools run on your own device. The service is provided as it is, and it
          may be changed, interrupted or withdrawn at any time without notice.
        </p>
      </Section>

      <Section heading="No warranty">
        <p>
          The tools are provided without warranty of any kind, express or implied, including any
          implied warranty of merchantability, fitness for a particular purpose or non-infringement.
          {' '}{entity} does not warrant that the tools will be uninterrupted, error-free, or that the
          results will be accurate or suitable for your purposes.
        </p>
        <p>
          Results depend on the values you enter, the assumptions each tool documents, and the
          behaviour of your browser. Encoding and rendering differ between browsers, and outputs may
          therefore differ too. Verify anything that matters before you rely on it.
        </p>
      </Section>

      <Section heading="Health information disclaimer">
        <p>
          The BMI calculator and the calorie calculator provide general information only. They are
          not medical advice, not a diagnosis, and not a treatment or dietary plan. They must not be
          used as a substitute for consultation with a doctor, dietitian or other qualified health
          professional.
        </p>
        <p>
          Both use population-level formulas with meaningful error margins for any individual. BMI
          cannot distinguish muscle from fat and is not valid during pregnancy or for anyone under
          twenty. Calorie estimates vary with metabolism, medication and health conditions the tools
          cannot see. Never adopt a very low calorie intake without professional supervision. If you
          have or suspect a health condition, seek advice from a qualified professional and do not
          delay doing so because of something you read here.
        </p>
      </Section>

      <Section heading="Financial information disclaimer">
        <p>
          The loan, mortgage, compound interest, salary and percentage calculators are informational
          tools. They are not financial, investment, lending, mortgage or tax advice, and they do not
          constitute an offer of credit or a quotation.
        </p>
        <p>
          The figures they produce are estimates from the formulas documented on each page and
          exclude fees, variable rates, taxes, insurance requirements, lender-specific rounding and
          local regulation. Projections of investment growth are illustrations at a constant rate,
          not forecasts, and do not account for inflation, charges or the possibility of loss. Speak
          to a qualified professional before making a financial decision.
        </p>
      </Section>

      <Section heading="Business documents and tax">
        <p>
          The invoice and receipt generators produce documents from the information you provide.
          They do not constitute accounting, tax or legal advice, and they cannot verify that a
          document meets the requirements of your jurisdiction. Rules on invoice content,
          sequential numbering, tax treatment, fiscal devices and record retention vary by country
          and by the nature of your business.
        </p>
        <p>
          A generated receipt is a record created from what you typed. It is not evidence that a
          payment took place. You are responsible for the accuracy of every document you create and
          for complying with the rules that apply to you.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <p>You agree not to use this site to:</p>
        <ul>
          <li>
            create documents that are false or misleading, including invoices or receipts for
            transactions that did not occur, or documents that impersonate another business or
            person;
          </li>
          <li>
            process material you have no right to process, or attempt to circumvent protection on a
            file you are not authorised to access;
          </li>
          <li>
            break, overload or probe the site, its hosting, or any system connected to it, or
            attempt to interfere with another person’s use of it;
          </li>
          <li>
            use the site in breach of any applicable law, or in any way that infringes someone
            else’s rights.
          </li>
        </ul>
        <p>
          The PDF tools deliberately refuse encrypted documents and provide no means of removing
          password protection. Do not attempt to use them for that purpose.
        </p>
      </Section>

      <Section heading="Your files and content">
        <p>
          You retain all rights in the files and text you process. Because that content is never
          transmitted to us, we acquire no rights in it, take no copy of it, and have no ability to
          access, restore or delete it. Keeping backups of anything important is your
          responsibility. See the <Link href="/privacy">privacy policy</Link> for the technical
          detail.
        </p>
      </Section>

      <Section heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, {entity} is not liable for any indirect,
          incidental, special, consequential or punitive damages, nor for any loss of profits,
          revenue, data or goodwill, arising from your use of or inability to use this site —
          including any decision made in reliance on a result it produced.
        </p>
        <p>
          Nothing in these terms excludes or limits liability that cannot lawfully be excluded or
          limited, including liability for death or personal injury caused by negligence, or for
          fraud or fraudulent misrepresentation.
        </p>
      </Section>

      <Section heading="Changes and governing law">
        <p>
          These terms may be updated. The date at the top of this page shows when they last changed,
          and continuing to use the site after a change means accepting the revised terms.
        </p>
        <p>
          {site.jurisdiction
            ? `These terms are governed by the laws of ${site.jurisdiction}, and the courts of that jurisdiction have exclusive jurisdiction over any dispute.`
            : 'The governing law and jurisdiction for these terms are published here once configured for this deployment.'}
        </p>
        <p>
          Questions about these terms can be sent to{' '}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
