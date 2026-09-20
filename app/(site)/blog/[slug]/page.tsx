import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Prose } from '@/components/blog/prose';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { features } from '@/lib/config/features';
import { absoluteUrl } from '@/lib/config/site';
import { getPost, listAllPosts } from '@/lib/marble/posts';
import { buildMetadata, DEFAULT_OG_IMAGE } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/structured-data';

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

export async function generateStaticParams(): Promise<Params[]> {
  const posts = await listAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const base = buildMetadata({
    title: post.title,
    description: post.description ?? '',
    path: `/blog/${post.slug}`,
    // Fall back to the site card when a post has no cover, rather than
    // emitting no image and letting crawlers pick something arbitrary.
    image: post.coverImage ?? DEFAULT_OG_IMAGE,
    type: 'article',
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: new Date(post.publishedAt).toISOString(),
      authors: post.authors?.map((author) => author.name) ?? [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  if (!features.blogEnabled) notFound();

  const { slug } = await params;
  // `generateMetadata` above requests the same post; Next dedupes that within
  // a request, so this is one network call rather than two.
  const post = await getPost(slug);
  if (!post) notFound();

  const published = new Date(post.publishedAt);

  return (
    <Container as="div" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: 'Blog', path: '/blog' },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <article className="mt-4">
        <header>
          <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
          {post.description ? (
            <p className="measure mt-3 text-lg text-muted">{post.description}</p>
          ) : null}
          <p className="mt-4 text-sm text-muted">
            <time dateTime={published.toISOString()}>
              {published.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            {post.authors && post.authors.length > 0
              ? ` · ${post.authors.map((author) => author.name).join(', ')}`
              : null}
          </p>
        </header>

        {post.coverImage ? (
          <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-sunken">
            <Image
              src={post.coverImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="mt-8">
          <Prose html={post.content} />
        </div>
      </article>

      <p className="mt-12 text-sm text-muted">
        <Link href="/blog" className="text-brand underline underline-offset-2">
          All posts
        </Link>
      </p>

      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            '@id': `${absoluteUrl(`/blog/${post.slug}`)}#post`,
            headline: post.title,
            description: post.description ?? '',
            url: absoluteUrl(`/blog/${post.slug}`),
            mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
            datePublished: published.toISOString(),
            inLanguage: 'en',
            ...(post.coverImage ? { image: post.coverImage } : {}),
            author:
              post.authors && post.authors.length > 0
                ? post.authors.map((author) => ({ '@type': 'Person', name: author.name }))
                : { '@id': `${absoluteUrl('/')}#organization` },
            publisher: { '@id': `${absoluteUrl('/')}#organization` },
          },
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
    </Container>
  );
}
