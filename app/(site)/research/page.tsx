import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Container } from '@/components/ui/container';
import {
  BENCHMARK_HEADING,
  BENCHMARK_PATH,
  RESEARCH_INDEX_PATH,
  SURVEY_PATH,
} from '@/lib/research/publication';
import { surveyIsLive } from '@/lib/research/survey';
import { benchmarkPublicationGate } from '@/lib/research/report';
import { buildMetadata } from '@/lib/seo/metadata';

/**
 * The research index.
 *
 * It exists only when there is something on it. With no published report and
 * no live survey, an index page would be a thin route whose only content is a
 * promise, so in production it 404s instead — the same rule the report itself
 * follows, for the same reason.
 */

const DESCRIPTION =
  'Original research from ToolNimbly on how very small businesses invoice and get paid, ' +
  'published with its methodology, its limitations and its aggregate data.';

function indexIsVisible(): { visible: boolean; published: boolean; preview: boolean } {
  const gate = benchmarkPublicationGate();
  return {
    visible: gate.visibility !== 'absent' || surveyIsLive(),
    published: gate.visibility === 'published',
    preview: gate.visibility === 'preview',
  };
}

export function generateMetadata(): Metadata {
  const { published } = indexIsVisible();

  return buildMetadata({
    title: 'Research',
    description: DESCRIPTION,
    path: RESEARCH_INDEX_PATH,
    // An index of one unpublished report has nothing to index.
    noIndex: !published,
    followWhenNoIndexed: true,
  });
}

export default function ResearchIndexPage() {
  const { visible, published, preview } = indexIsVisible();
  if (!visible) notFound();

  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Research', path: RESEARCH_INDEX_PATH },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Research</h1>
        <p className="measure text-muted mt-3 text-lg">
          This research is aimed at people who invoice for a business they run themselves. It asks
          questions the tools cannot answer, and publishes the results with the base, the method and
          the limitations attached.
        </p>
      </header>

      <ul className="mt-8 space-y-4">
        {published || preview ? (
          <li className="border-border-default bg-surface rounded-lg border p-5">
            <h2 className="font-medium">
              <Link href={BENCHMARK_PATH} className="hover:text-brand">
                {BENCHMARK_HEADING}
              </Link>
            </h2>
            <p className="text-muted mt-2 text-sm">
              What terms people put on an invoice, how long they wait to be paid, how often they are
              paid late, and what they do about it.
            </p>
            {preview ? (
              <p className="text-muted mt-2 text-xs font-medium">Preview — not published</p>
            ) : null}
          </li>
        ) : null}

        {surveyIsLive() ? (
          <li className="border-border-default bg-surface rounded-lg border p-5">
            <h2 className="font-medium">
              <Link href={SURVEY_PATH} className="hover:text-brand">
                Take part: invoice payment terms survey
              </Link>
            </h2>
            <p className="text-muted mt-2 text-sm">
              Twelve multiple-choice questions, about three minutes, anonymous, published only in
              aggregate.
            </p>
          </li>
        ) : null}
      </ul>
    </Container>
  );
}
