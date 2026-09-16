import Link from 'next/link';

import { ToolCard } from '@/components/navigation/tool-card';
import { ToolSearch } from '@/components/navigation/tool-search';
import { Container } from '@/components/ui/container';
import { featuredTools, orderedCategories } from '@/lib/registry';

export default function NotFound() {
  return (
    <Container className="py-16">
      <p className="text-sm font-medium tracking-wide text-brand uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">We could not find that page</h1>
      <p className="measure mt-3 text-lg text-muted">
        The address may be mistyped, or the page may have moved. Search for what you need, or start
        from one of the tools below.
      </p>

      <div className="mt-6">
        <ToolSearch className="w-full max-w-sm" />
      </div>

      <nav aria-label="Tool categories" className="mt-8">
        <h2 className="text-sm font-semibold">Browse by category</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {orderedCategories().map((category) => (
            <li key={category.slug}>
              <Link
                href={`/${category.slug}`}
                className="inline-flex min-h-11 items-center rounded-md border border-border-default bg-surface px-4 text-sm hover:border-brand-border"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section aria-labelledby="popular-heading" className="mt-10">
        <h2 id="popular-heading" className="text-xl font-semibold">
          Popular tools
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredTools().slice(0, 4).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </ul>
      </section>
    </Container>
  );
}
