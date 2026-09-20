import type { Post } from '@usemarble/sdk/models';
import Image from 'next/image';
import Link from 'next/link';

import { blogPostImageAlt } from '@/lib/marble/seo';

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * A post in the index list.
 *
 * The cover image declares explicit dimensions through `fill` inside a fixed
 * aspect-ratio box, so the card reserves its space before the image loads and
 * contributes nothing to CLS.
 */
export function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  return (
    <article className="group relative">
      <div
        className={
          'border-border-default bg-surface group-hover:border-brand-border flex h-full flex-col overflow-hidden rounded-xl border transition-colors ' +
          (featured ? 'sm:flex-row' : '')
        }
      >
        {post.coverImage ? (
          <div
            className={
              'bg-surface-sunken relative aspect-[16/9] w-full shrink-0 ' +
              (featured ? 'sm:aspect-auto sm:w-2/5' : '')
            }
          >
            <Image
              src={post.coverImage}
              alt={blogPostImageAlt(post)}
              fill
              sizes={featured ? '(max-width: 640px) 100vw, 40vw' : '(max-width: 640px) 100vw, 33vw'}
              className="object-cover"
              priority={featured}
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-5">
          {featured ? (
            <p className="text-brand text-xs font-medium tracking-wide uppercase">Featured</p>
          ) : null}
          <h3 className={featured ? 'mt-2 text-xl font-semibold' : 'text-base font-semibold'}>
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </h3>
          {post.description ? (
            <p className="measure text-muted mt-2 text-sm">{post.description}</p>
          ) : null}
          <p className="text-muted mt-4 text-xs">
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          </p>
        </div>
      </div>
    </article>
  );
}
