import type { Post } from '@usemarble/sdk/models';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Container } from '@/components/ui/container';

import { PostCard } from './post-card';

/** Server-rendered blog index. Breadcrumbs is the page's sole JSON-LD graph. */
export function BlogIndex({ posts }: { posts: readonly Post[] }) {
  const featured = posts.find((post) => post.featured) ?? null;
  const rest = posts.filter((post) => post.id !== featured?.id);

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
    </Container>
  );
}
