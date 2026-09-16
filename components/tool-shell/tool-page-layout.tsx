import { AdSlot } from '@/components/ads/ad-slot';
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
import type { ToolContent } from '@/content/types';
import { getCategory, relatedTools } from '@/lib/registry';
import type { ToolDefinition } from '@/lib/registry/types';

/**
 * The tool page anatomy required by spec §5.2, in the mandated order.
 *
 * The interactive panel sits directly under the heading so the primary action
 * is visible without scrolling past a preamble; all explanatory content follows
 * it and is server-rendered.
 */
export function ToolPageLayout({
  tool,
  content,
}: {
  tool: ToolDefinition;
  content: ToolContent;
}) {
  const category = getCategory(tool.category);
  const related = relatedTools(tool.slug);

  return (
    <Container as="div" className="py-6 sm:py-8">
      {/* 1. Breadcrumbs */}
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
        <p className="measure mt-3 text-lg text-muted">{content.valueProposition}</p>
      </header>

      {/* 3. Privacy badge */}
      {tool.localProcessing ? (
        <div className="mt-4">
          <PrivacyBadge />
        </div>
      ) : null}

      {/* 4 & 5. Interactive tool and its result region */}
      <div className="mt-6">
        <ToolPanel tool={tool} />
        {content.resultDisclaimer ? <ResultDisclaimer text={content.resultDisclaimer} /> : null}
      </div>

      <AdSlot placement="below-result" />

      {/* 6–9. Instructions, example, method, limitations */}
      <div className="mt-12 space-y-12">
        <HowToSteps steps={content.steps} toolName={tool.name.toLowerCase()} />
        <WorkedExample example={content.example} />
        {content.method ? <FormulaBlock method={content.method} /> : null}

        <AdSlot placement="in-content" />

        <Limitations
          limitations={content.limitations}
          privacyNote={content.privacyNote}
          sources={content.sources}
        />

        {/* 10. Visible FAQs */}
        <FaqList faqs={content.faqs} />
      </div>

      {/* 11. Curated related tools */}
      <RelatedTools
        tools={related}
        description={`Other tools people use alongside the ${tool.name.toLowerCase()}.`}
      />

      <p className="mt-10 text-sm text-muted">
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
    </Container>
  );
}
