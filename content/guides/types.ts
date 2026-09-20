/**
 * Supporting-article content (SEO brief §5).
 *
 * A guide explains a subject; a tool page operates a control. The shapes are
 * deliberately different: a guide has no steps, no worked example block and no
 * formula panel, because an article that apes a tool page reads like one and
 * gives a reader nothing new.
 */

import type { ContentFaq } from '@/content/types';

export type GuideSection = {
  /** Rendered as an `h2`. */
  readonly heading: string;
  readonly paragraphs: readonly string[];
  /** Optional list following the paragraphs. */
  readonly bullets?: readonly string[];
};

export type GuideContent = {
  /** Must match a guide registry slug exactly. */
  readonly slug: string;
  /** One sentence under the H1, in place of a tool's value proposition. */
  readonly standfirst: string;
  /** Opening paragraphs, before the first subheading. */
  readonly intro: readonly string[];
  readonly sections: readonly GuideSection[];
  /** Four to six questions, wired to FAQPage schema like the tool pages. */
  readonly faqs: readonly ContentFaq[];
  /** Short summary, rendered at the end. */
  readonly keyPoints: readonly string[];
};
