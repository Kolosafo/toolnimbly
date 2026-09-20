import type { Post } from '@usemarble/sdk/models';
import Image from 'next/image';
import Link from 'next/link';

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
          'flex h-full flex-col overflow-hidden rounded-xl border border-border-default bg-surface transition-colors group-hover:border-brand-border ' +
          (featured ? 'sm:flex-row' : '')
        }
      >
        {post.coverImage ? (
          <div
            className={
              'relative aspect-[16/9] w-full shrink-0 bg-surface-sunken ' +
              (featured ? 'sm:aspect-auto sm:w-2/5' : '')
            }
          >
            <Image
              src={post.coverImage}
              alt=""
              fill
              sizes={featured ? '(max-width: 640px) 100vw, 40vw' : '(max-width: 640px) 100vw, 33vw'}
              className="object-cover"
              priority={featured}
            />
          </div>
        ) : null}

        <div className="flex flex-1 flex-col p-5">
          {featured ? (
            <p className="text-xs font-medium tracking-wide text-brand uppercase">Featured</p>
          ) : null}
          <h3 className={featured ? 'mt-2 text-xl font-semibold' : 'text-base font-semibold'}>
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
              {post.title}
            </Link>
          </h3>
          {post.description ? (
            <p className="measure mt-2 text-sm text-muted">{post.description}</p>
          ) : null}
          <p className="mt-4 text-xs text-muted">
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          </p>
        </div>
      </div>
    </article>
  );
}
