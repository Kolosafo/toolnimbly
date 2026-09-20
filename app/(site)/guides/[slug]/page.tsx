import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GuideLayout } from '@/components/guides/guide-layout';
import { JsonLd } from '@/components/seo/json-ld';
import { findGuideContent } from '@/content/guides';
import { findGuide, guides } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';
import { faqSchema, guideArticleSchema } from '@/lib/seo/structured-data';

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return {};

  return buildMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: 'article',
  });
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const guide = findGuide(slug);
  const content = findGuideContent(slug);
  if (!guide || !content) notFound();

  return (
    <>
      <GuideLayout guide={guide} content={content} />
      <JsonLd data={[guideArticleSchema(guide), faqSchema(content)]} />
    </>
  );
}
