import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PostCard } from '@/components/blog/post-card';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { features } from '@/lib/config/features';
import { absoluteUrl } from '@/lib/config/site';
import { listAllPosts, splitFeatured } from '@/lib/marble/posts';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/structured-data';

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
  const { featured, rest } = splitFeatured(posts);

  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Blog</h1>
        <p className="measure text-muted mt-3 text-lg">
          Notes on the tools, the arithmetic behind them, and the privacy choices we make.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="measure border-border-default bg-surface-sunken text-muted mt-10 rounded-xl border p-6">
          There are no posts yet. In the meantime, the{' '}
          <Link href="/guides" className="text-brand underline underline-offset-2">
            guides
          </Link>{' '}
          cover the subjects behind the tools in depth.
        </p>
      ) : (
        <>
          {featured ? (
            <div className="mt-10">
              <PostCard post={featured} featured />
            </div>
          ) : null}

          {rest.length > 0 ? (
            <section aria-labelledby="recent-heading" className="mt-10">
              <h2 id="recent-heading" className="text-xl font-semibold">
                {featured ? 'More posts' : 'Recent posts'}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <li key={post.id}>
                    <PostCard post={post} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}

      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'ToolNimbly Blog',
            url: absoluteUrl('/blog'),
            blogPost: posts.slice(0, 20).map((post) => ({
              '@type': 'BlogPosting',
              headline: post.title,
              url: absoluteUrl(`/blog/${post.slug}`),
              datePublished: new Date(post.publishedAt).toISOString(),
            })),
          },
        ]}
      />
    </Container>
  );
}
