import { renderSocialImage } from '@/components/seo/tool-social-image';
import { BENCHMARK_TITLE } from '@/lib/research/publication';
import { benchmarkPublicationGate } from '@/lib/research/report';

export const runtime = 'nodejs';

/**
 * The report's 1200×630 social card, on the same template as the tool cards.
 *
 * Before publication it carries no statistic of any kind — not a sample size,
 * not a share, nothing. A social card is the part of a page most likely to be
 * screenshotted and passed on without its context, so it gets a number only
 * once that number is real and approved.
 */
export function GET(): Response {
  const gate = benchmarkPublicationGate();
  const sample =
    gate.visibility === 'published' && gate.summary ? gate.summary.totalValidResponses : null;

  return renderSocialImage({
    title: BENCHMARK_TITLE,
    differentiator: sample === null ? 'ToolNimbly research' : `${sample} valid responses`,
    alt:
      sample === null
        ? `${BENCHMARK_TITLE} — a ToolNimbly research report`
        : `${BENCHMARK_TITLE} — ToolNimbly research based on ${sample} valid survey responses`,
    accent: '#38bdf8',
  });
}
