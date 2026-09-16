import type { ContentFaq } from '@/content/types';

/**
 * FAQs (spec §5.2, §8.2).
 *
 * Rendered with native `<details>` so they are keyboard-operable and their text
 * is present in the server-rendered HTML — which is required for the FAQ schema
 * on the same page to be truthful.
 */
export function FaqList({ faqs }: { faqs: readonly ContentFaq[] }) {
  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-xl font-semibold">
        Frequently asked questions
      </h2>
      <div className="mt-4 divide-y divide-[color:var(--border)] rounded-lg border border-border-default bg-surface">
        {faqs.map((faq) => (
          <details key={faq.question} className="group px-5 py-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-medium">
              <h3 className="text-base font-medium">{faq.question}</h3>
              <span
                aria-hidden="true"
                className="shrink-0 text-xl leading-none text-muted transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="measure mt-3 text-sm text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
