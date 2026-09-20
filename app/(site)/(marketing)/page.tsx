import { Lock, Search, Sparkles, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { CategoryCard } from '@/components/navigation/category-card';
import { ToolCard } from '@/components/navigation/tool-card';
import { ToolSearch } from '@/components/navigation/tool-search';
import { Container } from '@/components/ui/container';
import { site } from '@/lib/config/site';
import {
  featuredTools,
  getCategory,
  orderedCategories,
  recentlyUpdatedTools,
  tools,
  toolsInCategory,
} from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({
  title: site.name,
  description: site.description,
  path: '/',
});

const benefits = [
  {
    Icon: Lock,
    title: 'Your files stay on your device',
    body: 'Images, PDFs and text are processed by your own browser. There is no upload endpoint in this product, so there is nothing to leak, retain or delete.',
  },
  {
    Icon: Zap,
    title: 'No signup, no queue, no watermark',
    body: 'Every tool works immediately. Nothing is gated behind an account, a free-trial limit or a paid tier, and no output is stamped with a logo.',
  },
  {
    Icon: Sparkles,
    title: 'Honest about what it cannot do',
    body: 'Where a limit is real — PDF compression, image quality, BMI as a health measure — it is stated plainly on the page rather than hidden behind a marketing claim.',
  },
];

export default function HomePage() {
  const categories = orderedCategories();
  const popular = featuredTools();
  const recent = recentlyUpdatedTools(4);

  return (
    <>
      <section className="border-b border-border-default bg-surface">
        <Container className="py-14 sm:py-20">
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            {tools.length} fast, private tools that run in your browser
          </h1>
          <p className="measure mt-5 text-lg text-muted">
            Calculators, text utilities, image editors, PDF tools and document generators. Your
            files and text never leave your device — and there is nothing to sign up for.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ToolSearch className="w-full sm:w-72" />
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Search className="size-4" aria-hidden="true" />
              or browse the {categories.length} categories below
            </span>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-2xl font-semibold">
            Browse by category
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const categoryTools = toolsInCategory(category.slug);
              return (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  toolCount={categoryTools.length}
                  sampleTools={categoryTools.slice(0, 3).map((tool) => tool.shortName)}
                />
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="popular-heading" className="mt-16">
          <h2 id="popular-heading" className="text-2xl font-semibold">
            Popular tools
          </h2>
          <p className="measure mt-2 text-muted">
            A hand-picked cross-section rather than a traffic ranking — one or two from each part of
            the site, so you can see what is here.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((tool) => (
              <ToolCard
                key={tool.slug}
                tool={tool}
                showCategory
                categoryName={getCategory(tool.category).shortName}
              />
            ))}
          </ul>
        </section>

        <section aria-labelledby="privacy-heading" className="mt-16">
          <h2 id="privacy-heading" className="text-2xl font-semibold">
            Why the tools work this way
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {benefits.map(({ Icon, title, body }) => (
              <li key={title} className="rounded-lg border border-border-default bg-surface p-6">
                <Icon className="size-5 text-brand" aria-hidden="true" />
                <h3 className="mt-3 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="recent-heading" className="mt-16">
          <h2 id="recent-heading" className="text-2xl font-semibold">
            Recently reviewed
          </h2>
          <p className="measure mt-2 text-muted">
            Tools whose calculations and written guidance were last checked. Review dates come from
            actual reviews, not from an automatic timestamp.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </ul>
        </section>

        <section aria-labelledby="about-site-heading" className="mt-16">
          <h2 id="about-site-heading" className="text-2xl font-semibold">
            What {site.name} is for
          </h2>
          <div className="measure mt-4 space-y-4 text-muted">
            <p>
              Most everyday utility tasks — working out a loan payment, shrinking a photo to fit an
              upload limit, merging two PDFs before sending them — do not need a server, an account
              or a subscription. Browsers have been able to do all of this locally for years. This
              site is built on that: the tool code runs in your tab, your data stays with you, and
              the page loads fast because there is no heavy application behind it.
            </p>
            <p>
              Every tool page explains what the tool does, shows the formula or the processing steps
              it uses, works through a real example, and states its limitations. Where a calculation
              has a standard published method, that method is named and cited. Where a result should
              not be relied on — health estimates, financial projections, tax treatment — that is
              said next to the result rather than buried in the terms.
            </p>
            <p>
              You can read more about how the site is built and tested on the{' '}
              <Link href="/about" className="text-brand underline underline-offset-2">
                about page
              </Link>
              , and exactly what is and is not collected in the{' '}
              <Link href="/privacy" className="text-brand underline underline-offset-2">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </section>
      </Container>
    </>
  );
}
