import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogIndex } from '@/components/blog/blog-index';
import { features } from '@/lib/config/features';
import { listAllPosts } from '@/lib/marble/posts';
import { buildMetadata } from '@/lib/seo/metadata';

/*
 * Time-based revalidation, in addition to the publish webhook.
 *
 * Without this the page is a build-time snapshot that can only ever change on
 * a redeploy or a successful webhook call. That makes a single missed webhook
 * permanent: the blog silently serves an empty index until someone notices and
 * redeploys, which is exactly what happened on the first production build.
 *
 * The webhook is still what makes a publish appear in seconds; this is the
 * floor under it. Ten minutes is short enough that a missed webhook is a delay
 * rather than an outage, and long enough that the CMS is not polled hard.
 *
 * Must be a literal — Next.js requires the value to be statically analysable.
 */
export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: 'Blog',
  description:
    'Notes on the tools, the arithmetic behind them and the privacy choices we make. Written by the people who build ToolNimbly.',
  path: '/blog',
});

export default async function BlogIndexPage() {
  // The route exists in the build only when the blog is on; this keeps it a
  // genuine 404 rather than an empty page if the flag is flipped off later.
  if (!features.blogEnabled) notFound();

  const posts = await listAllPosts();
  return <BlogIndex posts={posts} />;
}
