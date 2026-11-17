'use client';

/** Only article links to a first-party tool count as blog-to-tool referrals. */
export function toolSlugFromArticleClick(target: EventTarget | null): string | null {
  const element =
    target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  const href = element?.closest('article a[href]')?.getAttribute('href');
  if (!href) return null;

  let destination: URL;
  try {
    destination = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (destination.origin !== window.location.origin) return null;
  return /^\/tools\/([a-z0-9-]+)\/?$/.exec(destination.pathname)?.[1] ?? null;
}
