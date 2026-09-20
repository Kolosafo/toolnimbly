import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/seo/json-ld';
import { ToolPageLayout } from '@/components/tool-shell/tool-page-layout';
import { findContent } from '@/content';
import { findTool, tools } from '@/lib/registry';
import { buildMetadata } from '@/lib/seo/metadata';
import { faqSchema, toolApplicationSchema } from '@/lib/seo/structured-data';
import { PRIORITY_TOOL_SOCIAL_IMAGES, toolSocialImagePath } from '@/lib/seo/tool-social-images';

type Params = { slug: string };

/**
 * All 30 tool pages are prerendered at build time from the registry
 * (spec §7.1). `dynamicParams` is off so an unknown slug returns a genuine 404
 * status rather than being rendered on demand.
 */
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const tool = findTool(slug);
  if (!tool) return {};
  const socialImage = PRIORITY_TOOL_SOCIAL_IMAGES[tool.slug];
  const socialImagePath = toolSocialImagePath(tool.slug);

  return buildMetadata({
    title: tool.title,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    ...(socialImagePath ? { image: socialImagePath } : {}),
    ...(socialImage ? { imageAlt: socialImage.alt } : {}),
  });
}

export default async function ToolPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const tool = findTool(slug);
  const content = findContent(slug);

  // A registry entry without a content module is a build-time error caught by
  // `assertRegistryValid`; this guard keeps the route type-safe regardless.
  if (!tool || !content) notFound();

  return (
    <>
      <ToolPageLayout tool={tool} content={content} />
      <JsonLd data={[toolApplicationSchema(tool, content), faqSchema(content)]} />
    </>
  );
}
