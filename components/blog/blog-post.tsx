import type { Post } from '@usemarble/sdk/models';
import Image from 'next/image';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Container } from '@/components/ui/container';
import { site } from '@/lib/config/site';
import {
  BLOG_AUTHOR_PATH,
  blogPostDates,
  blogPostDescription,
  blogPostImageAlt,
  blogPostSchema,
  relatedBlogContent,
} from '@/lib/marble/seo';

import { Prose } from './prose';

/** The entire article body is rendered on the server from the CMS response. */
export function BlogPost({ post }: { post: Post }) {
  const { published, modified, wasUpdated } = blogPostDates(post);
  const related = relatedBlogContent(post);

  // The ingestion guard normally catches this first. Keeping the check here
  // prevents an on-demand post from silently shipping without its required
  // contextual links between publishing and the next sitemap/build run.
  if (!related) {
    throw new Error(
      `[marble] published post "${post.slug}" needs relatedToolSlug and relatedGuideSlug`,
    );
  }

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
          <p className="measure text-muted mt-3 text-lg">{blogPostDescription(post)}</p>
          <p className="text-muted mt-4 flex flex-wrap gap-x-2 gap-y-1 text-sm">
            <span>
              Published <time dateTime={published.toISOString()}>{formatDate(published)}</time>
            </span>
            {wasUpdated ? (
              <span>
                · Updated <time dateTime={modified.toISOString()}>{formatDate(modified)}</time>
              </span>
            ) : null}
            <span>
              · By{' '}
              <Link
                href={BLOG_AUTHOR_PATH}
                rel="author"
                className="text-brand underline underline-offset-2"
              >
                {site.name}
              </Link>
            </span>
          </p>
        </header>

        {post.coverImage ? (
          <div className="bg-surface-sunken relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-xl">
            <Image
              src={post.coverImage}
              alt={blogPostImageAlt(post)}
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

        <section
          aria-labelledby="related-reading-heading"
          className="border-border-default bg-surface-sunken mt-12 rounded-xl border p-5"
        >
          <h2 id="related-reading-heading" className="text-xl font-semibold">
            Put this into practice
          </h2>
          <p className="measure text-muted mt-2 text-sm">
            Use the{' '}
            <Link
              href={`/tools/${related.tool.slug}`}
              className="text-brand underline underline-offset-2"
            >
              {related.tool.shortName} tool
            </Link>{' '}
            for the calculation, then read{' '}
            <Link
              href={`/guides/${related.guide.slug}`}
              className="text-brand underline underline-offset-2"
            >
              {related.guide.name}
            </Link>{' '}
            for the supporting explanation.
          </p>
        </section>
      </article>

      <p className="text-muted mt-12 text-sm">
        <Link href="/blog" className="text-brand underline underline-offset-2">
          All posts
        </Link>
      </p>

      <JsonLd data={blogPostSchema(post)} />
    </Container>
  );
}

function formatDate(value: Date): string {
  return value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
