import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BlogPost } from '@/components/blog/blog-post';
import { features } from '@/lib/config/features';
import { getPost, listAllPosts } from '@/lib/marble/posts';
import { buildBlogPostMetadata } from '@/lib/marble/seo';

type Params = { slug: string };

/**
 * Unlike the tool and guide routes, this one keeps `dynamicParams` on.
 *
 * Those registries are code, so an unknown slug is genuinely a 404. Posts are
 * not: one published in Marble after the last deploy has no build-time entry,
 * and `dynamicParams = false` would return 404 for a URL the editor can see
 * live in the CMS. Leaving it on lets a new post render on demand, and the
 * publish webhook then caches it.
 */
export const dynamicParams = true;

/*
 * As on the index: the webhook handles publishes and edits, and this is the
 * floor under it if one is missed. Longer here because an individual post
 * changes far less often than the list of posts.
 */
export const revalidate = 3600;

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await listAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return buildBlogPostMetadata(post);
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  if (!features.blogEnabled) notFound();

  const { slug } = await params;
  // `generateMetadata` above requests the same post; Next dedupes that within
  // a request, so this is one network call rather than two.
  const post = await getPost(slug);
  if (!post) notFound();
  return <BlogPost post={post} />;
}
