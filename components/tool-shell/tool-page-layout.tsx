import Link from 'next/link';

import { AdSlot } from '@/components/ads/ad-slot';
import { ToolUsageTracker } from '@/components/analytics/tool-usage-tracker';
import { EmbedDialog } from '@/components/embed/embed-dialog';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { RelatedTools } from '@/components/navigation/related-tools';
import { FaqList } from '@/components/tool-shell/faq-list';
import { FormulaBlock } from '@/components/tool-shell/formula-block';
import { HowToSteps } from '@/components/tool-shell/how-to-steps';
import { Limitations } from '@/components/tool-shell/limitations';
import { PrivacyBadge } from '@/components/tool-shell/privacy-badge';
import { ResultDisclaimer } from '@/components/tool-shell/result-disclaimer';
import { ToolPanel } from '@/components/tool-shell/tool-panel';
import { WorkedExample } from '@/components/tool-shell/worked-example';
import { Container } from '@/components/ui/container';
import { findToolDeepDive } from '@/content/tool-deep-dives';
import type { ToolContent } from '@/content/types';
import { buildEmbedSnippet } from '@/lib/embed/snippet';
import { getCategory, guidesForTool, relatedTools } from '@/lib/registry';
import type { ToolDefinition } from '@/lib/registry/types';

/**
 * The tool page anatomy required by spec §5.2, in the mandated order.
 *
 * The interactive panel sits directly under the heading so the primary action
 * is visible without scrolling past a preamble; all explanatory content follows
 * it and is server-rendered.
 */
export function ToolPageLayout({ tool, content }: { tool: ToolDefinition; content: ToolContent }) {
  const category = getCategory(tool.category);
  const related = relatedTools(tool.slug);
  const deepDive = findToolDeepDive(tool.slug);
  // Curated by the guide, not by the tool: a guide declares the tools it
  // supports, so there is one list to keep in step rather than two.
  const supportingGuides = guidesForTool(tool.slug);

  return (
    <Container as="div" className="py-6 sm:py-8">
      {/* 1. Breadcrumbs */}
      <div className="print:hidden">
        <Breadcrumbs
          entries={[
            { name: 'Home', path: '/' },
            { name: category.name, path: `/${category.slug}` },
            { name: tool.shortName, path: `/tools/${tool.slug}` },
          ]}
        />

        {/* 2. H1 and value proposition */}
        <header className="mt-4">
          <h1 className="text-3xl font-bold sm:text-4xl">{tool.name}</h1>
          <p className="measure text-muted mt-3 text-lg">{content.valueProposition}</p>
        </header>
      </div>

      {/* 3. Privacy badge */}
      {tool.localProcessing ? (
        <div className="mt-4">
          <PrivacyBadge />
        </div>
      ) : null}

      {/* 4 & 5. Interactive tool and its result region.
          The panel is a labelled landmark so screen-reader and keyboard users
          can jump straight to the working part of the page, past the
          explanatory content that follows it. */}
      <section aria-label={`${tool.name} tool`} className="mt-6">
        <ToolUsageTracker tool={tool.slug}>
          <ToolPanel tool={tool} />
        </ToolUsageTracker>
        {content.resultDisclaimer ? <ResultDisclaimer text={content.resultDisclaimer} /> : null}
      </section>

      {/* Placed under the tool, not above it: the visitor came to use the tool,
          and whoever wants to embed it will have used it first. The snippets
          are built here, on the server, so the dialog ships no URL logic. */}
      <div className="mt-4 print:hidden">
        <EmbedDialog
          toolName={tool.name}
          snippets={{
            auto: buildEmbedSnippet(tool, 'auto'),
            light: buildEmbedSnippet(tool, 'light'),
            dark: buildEmbedSnippet(tool, 'dark'),
          }}
        />
      </div>

      <AdSlot placement="below-result" />

      {/* 6–9. Explanation, instructions, example, method and limitations.
          Hidden when printing: a printed invoice should be the document, not
          the page that generated it. */}
      <div className="mt-12 space-y-12 print:hidden">
        <section aria-labelledby="what-this-tool-does-heading">
          <h2 id="what-this-tool-does-heading" className="text-xl font-semibold">
            What this tool does
          </h2>
          <p className="measure text-muted mt-3 text-sm">{content.intro}</p>
        </section>

        <HowToSteps steps={content.steps} />
        <WorkedExample example={content.example} />
        {content.method ? <FormulaBlock method={content.method} /> : null}

        {deepDive ? (
          <section aria-labelledby="tool-context-heading">
            <h2 id="tool-context-heading" className="text-xl font-semibold">
              {deepDive.heading}
            </h2>
            <div className="measure text-muted mt-3 space-y-4 text-sm">
              {deepDive.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ) : null}

        <AdSlot placement="in-content" />

        <Limitations
          limitations={content.limitations}
          privacyNote={content.privacyNote}
          sources={content.sources}
        />

        {/* 10. Visible FAQs */}
        <FaqList faqs={content.faqs} />
      </div>

      {/* 11. Curated related tools, and the articles that explain them */}
      <div className="print:hidden">
        {supportingGuides.length > 0 ? (
          <section aria-labelledby="supporting-guides-heading" className="mt-12">
            <h2 id="supporting-guides-heading" className="text-xl font-semibold">
              Read more about this
            </h2>
            <ul className="mt-4 space-y-3">
              {supportingGuides.map((guide) => (
                <li key={guide.slug} className="group relative">
                  <div className="border-border-default bg-surface group-hover:border-brand-border rounded-lg border p-4 transition-colors">
                    <h3 className="text-sm font-medium">
                      <Link href={`/guides/${guide.slug}`} className="after:absolute after:inset-0">
                        {guide.name}
                      </Link>
                    </h3>
                    <p className="text-muted mt-1 text-xs">{guide.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <RelatedTools
          tools={related}
          description={`Other tools people use alongside the ${tool.name.toLowerCase()}.`}
        />

        <p className="text-muted mt-10 text-sm">
          Part of{' '}
          <a href={`/${category.slug}`} className="text-brand underline underline-offset-2">
            {category.name}
          </a>
          . Last reviewed{' '}
          <time dateTime={tool.updatedAt}>
            {new Date(`${tool.updatedAt}T00:00:00Z`).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </time>
          .
        </p>
      </div>
    </Container>
  );
}
