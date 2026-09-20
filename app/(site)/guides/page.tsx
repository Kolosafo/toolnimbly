import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { absoluteUrl } from '@/lib/config/site';
import { guides, guidesInCategory, orderedCategories } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Guides',
  description:
    'Plain explanations of the subjects behind the tools: loan interest, password strength, image formats, PDF size and invoicing.',
  path: '/guides',
});

export default function GuidesPage() {
  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Guides</h1>
        <p className="measure text-muted mt-3 text-lg">
          The tools do the arithmetic. These explain what the arithmetic means — why a loan&rsquo;s
          early payments are mostly interest, why a scanned PDF is enormous, why length beats
          symbols in a password.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        {orderedCategories().map((category) => {
          const inCategory = guidesInCategory(category.slug);
          if (inCategory.length === 0) return null;

          return (
            <section key={category.slug} aria-labelledby={`guides-${category.slug}`}>
              <h2 id={`guides-${category.slug}`} className="text-xl font-semibold">
                <Link href={`/${category.slug}`} className="hover:text-brand">
                  {category.name}
                </Link>
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {inCategory.map((guide) => (
                  <li key={guide.slug} className="group relative">
                    <div className="border-border-default bg-surface group-hover:border-brand-border h-full rounded-lg border p-5 transition-colors">
                      <h3 className="font-medium">
                        <Link
                          href={`/guides/${guide.slug}`}
                          className="after:absolute after:inset-0"
                        >
                          {guide.name}
                        </Link>
                      </h3>
                      <p className="text-muted mt-2 text-sm">{guide.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Guides',
          url: absoluteUrl('/guides'),
          hasPart: guides.map((guide) => ({
            '@type': 'Article',
            headline: guide.name,
            url: absoluteUrl(`/guides/${guide.slug}`),
          })),
        }}
      />
    </Container>
  );
}
