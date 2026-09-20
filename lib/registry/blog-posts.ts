/**
 * CMS-authored posts that code links to by slug.
 *
 * Blog posts live in Marble, so they cannot be enumerated from this repository
 * the way tools and guides can. When a code-managed page wants to link to one —
 * the research report does — the slug has to be written down somewhere, and
 * this is that somewhere: one list, referenced by the pages that link and by
 * the link-integrity test, rather than a slug string buried in JSX.
 *
 * These links render only when `NEXT_PUBLIC_BLOG_ENABLED` is on. With the blog
 * off the routes are not built at all, and an unconditional link would be a
 * 404 in the middle of a research report.
 */

export type ReferencedBlogPost = {
  /** The Marble post slug, which is also its route segment under `/blog/`. */
  readonly slug: string;
  /** What the post covers, for the benefit of whoever reads this list next. */
  readonly summary: string;
};

export const REFERENCED_BLOG_POSTS = {
  invoicePaymentTerms: {
    slug: 'invoice-payment-terms-explained-due-on-receipt-net-7-net-15-and-net-30',
    summary: 'What due on receipt, Net 7, Net 15 and Net 30 ask of a customer.',
  },
  invoiceVsReceipt: {
    slug: 'invoice-vs-receipt-what-is-the-difference-and-when-do-you-use-each',
    summary: 'Which document to send, and when.',
  },
} as const satisfies Readonly<Record<string, ReferencedBlogPost>>;

export function referencedBlogPostPaths(): string[] {
  return Object.values(REFERENCED_BLOG_POSTS).map((post) => `/blog/${post.slug}`);
}
