import type { ContentStep } from '@/content/types';

export function HowToSteps({ steps }: { steps: readonly ContentStep[] }) {
  return (
    <section aria-labelledby="how-to-heading">
      <h2 id="how-to-heading" className="text-xl font-semibold">
        How to use this tool
      </h2>
      <ol className="mt-4 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="bg-brand-surface text-brand mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            >
              {index + 1}
            </span>
            <div className="measure">
              <h3 className="text-base font-medium">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="text-muted mt-1 text-sm">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
