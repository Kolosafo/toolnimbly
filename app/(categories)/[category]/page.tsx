import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { ToolCard } from '@/components/navigation/tool-card';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { ToolIcon } from '@/components/ui/tool-icon';
import { adjacentCategories, categories, findCategory, toolsInCategory } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';
import { categoryCollectionSchema } from '@/lib/seo/structured-data';

type Params = { category: string };

/**
 * The five category pages are prerendered from the registry. `dynamicParams`
 * is off so any other segment is a true 404 rather than an on-demand render
 * (spec §8.1).
 */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = findCategory(slug);
  if (!category) return {};

  return buildMetadata({
    title: category.title,
    description: category.description,
    path: `/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { category: slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  const categoryTools = toolsInCategory(category.slug);
  const adjacent = adjacentCategories(category.slug);

  return (
    <Container className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: category.name, path: `/${category.slug}` },
        ]}
      />

      <header className="mt-4">
        <ToolIcon name={category.icon} className="size-7 text-brand" />
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{category.heading}</h1>
        <p className="measure mt-4 text-lg text-muted">{category.intro}</p>
      </header>

      <section aria-labelledby="tools-heading" className="mt-10">
        <h2 id="tools-heading" className="text-xl font-semibold">
          All {categoryTools.length} {category.name.toLowerCase()}
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="guidance-heading" className="mt-14">
        <h2 id="guidance-heading" className="text-xl font-semibold">
          Which one should you use?
        </h2>
        <ul className="mt-4 space-y-3">
          {category.selectionGuidance.map((guidance) => (
            <li key={guidance} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand"
              />
              <p className="measure text-muted">{guidance}</p>
            </li>
          ))}
        </ul>
      </section>

      {adjacent.length > 0 ? (
        <nav aria-labelledby="adjacent-heading" className="mt-14">
          <h2 id="adjacent-heading" className="text-xl font-semibold">
            Explore next
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {adjacent.map((other) => (
              <li key={other.slug} className="group relative">
                <div className="flex h-full gap-3 rounded-lg border border-border-default bg-surface p-5 transition-colors group-hover:border-brand-border">
                  <ToolIcon name={other.icon} className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <h3 className="text-base font-medium">
                      <Link href={`/${other.slug}`} className="after:absolute after:inset-0">
                        {other.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-sm text-muted">{other.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <JsonLd data={categoryCollectionSchema(category, categoryTools)} />
    </Container>
  );
}
