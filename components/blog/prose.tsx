import { cn } from '@/lib/utils/cn';

/**
 * Renders a Marble post's HTML body.
 *
 * Marble returns `content` as an HTML string, so this is the one place in the
 * product that injects markup rather than text. It is an audited exception to
 * `react/no-danger`, and it is only defensible because of where the HTML comes
 * from: a CMS whose authors are the site's own staff, reached with a
 * server-side API key. No visitor input reaches this component, and nothing a
 * visitor types anywhere in the product is ever rendered as HTML.
 *
 * If the workspace is ever opened to outside contributors, this must sanitise
 * server-side before rendering. The CSP is a partial backstop — `script-src`
 * permits no external origin and `connect-src 'self'` blocks exfiltration —
 * but `'unsafe-inline'` is present for React's own bootstrap, so the policy
 * would not stop an inline script in post content.
 */
export function Prose({ html, className }: { html: string; className?: string }) {
  // The page template owns the sole H1. Marble's rich-text editor may include
  // one in pasted content, so demote body-level H1s before server rendering.
  const articleHtml = html.replace(/<h1(\s|>)/gi, '<h2$1').replace(/<\/h1\s*>/gi, '</h2>');

  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-a:text-brand prose-img:rounded-xl',
        'prose-pre:overflow-x-auto',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: articleHtml }}
    />
  );
}
