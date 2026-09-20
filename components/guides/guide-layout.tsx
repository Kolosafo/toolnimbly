import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { RelatedTools } from '@/components/navigation/related-tools';
import { FaqList } from '@/components/tool-shell/faq-list';
import { Container } from '@/components/ui/container';
import type { GuideContent } from '@/content/guides';
import { getCategory, getTool } from '@/lib/registry';
import type { GuideDefinition } from '@/lib/registry/guides';

/**
 * A supporting article (SEO brief §5).
 *
 * The shape deliberately differs from a tool page: prose first, no interactive
 * panel, and the tools it supports arriving at the end, once the reader knows
 * enough to want one.
 */
export function GuideLayout({
  guide,
  content,
}: {
  guide: GuideDefinition;
  content: GuideContent;
}) {
  const category = getCategory(guide.category);
  const tools = guide.relatedToolSlugs.map((slug) => getTool(slug));

  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: category.shortName, path: `/${category.slug}` },
        ]}
      />

      <article className="mt-4">
        <header>
          <p className="text-sm font-medium tracking-wide text-brand uppercase">
            {category.name}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{guide.name}</h1>
          <p className="measure mt-3 text-lg text-muted">{content.standfirst}</p>
        </header>

        <div className="measure mt-8 space-y-4">
          {content.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          {content.sections.map((section) => (
            <section key={section.heading} aria-labelledby={headingId(section.heading)}>
              <h2 id={headingId(section.heading)} className="text-xl font-semibold">
                {section.heading}
              </h2>
              <div className="measure mt-3 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="measure mt-4 space-y-2">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2 text-sm text-muted">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1 shrink-0 rounded-full bg-subtle"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <section aria-labelledby="key-points-heading" className="mt-12">
          <h2 id="key-points-heading" className="text-xl font-semibold">
            In short
          </h2>
          <ul className="measure mt-4 space-y-2 rounded-xl border border-border-default bg-surface-sunken p-5">
            {content.keyPoints.map((point) => (
              <li key={point} className="flex gap-2 text-sm">
                <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-brand" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <FaqList faqs={content.faqs} />
        </div>
      </article>

      <RelatedTools
        tools={tools}
        heading="Tools for this"
        description="Everything below runs in your browser. Nothing you enter is uploaded."
      />
    </Container>
  );
}

function headingId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
