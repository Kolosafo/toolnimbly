import type { Metadata } from 'next';
import Link from 'next/link';

import { features } from '@/lib/config/features';
import { site } from '@/lib/config/site';
import { tools } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';

import { LegalPage, Section } from '../legal-prose';

export const metadata: Metadata = buildMetadata({
  title: `About ${site.name}`,
  description:
    'How ToolNimbly is built, how its calculations are tested and reviewed, who runs it, and why every tool processes your data on your own device.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <LegalPage
      title={`About ${site.name}`}
      path="/about"
      updated="2026-09-20"
      showConfigurationNotice
      intro={`${site.name} is a collection of ${tools.length} browser utilities built on one principle: the work should happen on your device, not on someone else's server.`}
    >
      <Section heading="Why this site exists">
        <p>
          Searching for something as ordinary as “compress a PDF” or “work out a loan payment”
          usually leads to a page that wants an upload, an account, or an email address before it
          will do anything. Most of that is unnecessary. Browsers can decode images, render PDF
          pages, assemble documents and run arbitrary arithmetic without any help from a server.
        </p>
        <p>
          So these tools do exactly that. When you compress an image here, your browser reads the
          file, re-encodes it and hands you the result. The file is never transmitted, because there
          is no endpoint to transmit it to. That is not a privacy policy promise about how we handle
          your data — it is an architectural fact about where the code runs.
        </p>
      </Section>

      <Section heading="How the calculations are tested">
        <p>
          Every formula lives in a plain TypeScript function with no dependency on the interface,
          and each one has unit tests covering its reference cases, its boundary conditions and the
          inputs that ought to be refused. Some concrete examples of what is pinned down by tests:
        </p>
        <ul>
          <li>
            A twelve-month, 0% loan of 1,200 produces twelve payments that total exactly 1,200, and
            the amortisation schedule ends at a zero balance rather than a few cents either side.
          </li>
          <li>
            Date arithmetic is done on calendar dates rather than timestamps, so the day count
            between two dates is unaffected by daylight-saving transitions. The test suite runs in a
            timezone that observes DST precisely so this cannot pass by accident.
          </li>
          <li>
            Money in the invoice and receipt generators uses exact decimal arithmetic. Totals are
            checked to match between the on-screen figures and the generated PDF.
          </li>
          <li>
            Generated QR codes are decoded again in the test suite to confirm they carry the payload
            they are supposed to.
          </li>
          <li>
            Passwords and UUIDs are checked to draw only from the Web Crypto API, with the character
            distribution verified to be free of modulo bias.
          </li>
        </ul>
        <p>
          File-handling tools are tested against real fixture files, including images with unusual
          EXIF orientations, PDFs with mixed page sizes and rotations, and deliberately corrupted
          files that must fail cleanly rather than freeze the page.
        </p>
      </Section>

      <Section heading="How the content is written and reviewed">
        <p>
          Each tool page is written for that tool. There is no template paragraph repeated across
          thirty pages with the nouns swapped, and there are no keyword-variant pages created to
          capture slightly different phrasings of the same search.
        </p>
        <p>
          Where a calculation follows a published standard method — the Mifflin-St Jeor equation,
          the standard BMI thresholds, fixed-rate amortisation — the method is named on the page and
          linked to its source. Where a tool has real limitations, those are written down in a
          section of their own rather than omitted. The PDF compressor page, for instance, says
          plainly that structure optimisation often saves very little, because that is true and
          because the alternative is to let the tool look broken.
        </p>
        <p>
          The “last reviewed” date on each tool page reflects an actual review of that tool and its
          copy. It is not refreshed automatically to make pages look current.
        </p>
      </Section>

      <Section heading="Accessibility">
        <p>
          The target is WCAG 2.2 AA. Every tool is operable by keyboard alone, including the file
          drop zones, the crop handles, the sortable file lists and the search dialog. Results are
          announced to screen readers, status is never communicated by colour alone, and the whole
          site works at 320 CSS pixels and at 200% zoom. Automated accessibility scans run in
          continuous integration, and the keyboard and screen-reader paths are checked by hand.
        </p>
      </Section>

      <Section heading="Who runs this">
        <p>
          {site.legalEntity
            ? `${site.name} is operated by ${site.legalEntity}.`
            : `${site.name} is operated independently. The registered operating entity is published here once it is configured for this deployment.`}{' '}
          You can reach us at <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> — see
          the <Link href="/contact">contact page</Link> for what to include.
        </p>
        <p>
          There are no advertisements on the site at present.{' '}
          {features.analyticsEnabled
            ? 'Anonymous usage analytics are available only after a visitor opts in.'
            : 'No analytics are running on this deployment.'}{' '}
          The <Link href="/privacy">privacy policy</Link> explains the exact event fields and the
          consent control.
        </p>
      </Section>

      <Section heading="What we do not claim">
        <p>
          No tool here is described as “100% secure”, “perfectly accurate” or “the best”. The
          calculators produce estimates from stated formulas with stated assumptions. The health
          tools are general information and not medical advice. The financial tools are not
          financial advice. The invoice and receipt generators produce clear documents but cannot
          guarantee compliance with the tax and record-keeping rules of any particular country.
        </p>
        <p>
          Those limits are stated on the individual pages, next to the results they apply to, and
          again in the <Link href="/terms">terms</Link>.
        </p>
      </Section>
    </LegalPage>
  );
}
