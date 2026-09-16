import { Info, Lock } from 'lucide-react';

import type { ContentSource } from '@/content/types';

export function Limitations({
  limitations,
  privacyNote,
  sources,
}: {
  limitations: readonly string[];
  privacyNote: string;
  sources?: readonly ContentSource[];
}) {
  return (
    <section aria-labelledby="limitations-heading">
      <h2 id="limitations-heading" className="text-xl font-semibold">
        Limitations and privacy
      </h2>

      <div className="mt-4 rounded-lg border border-info-border bg-info-surface p-5">
        <h3 className="flex items-center gap-2 text-base font-medium">
          <Info className="size-4 shrink-0 text-info" aria-hidden="true" />
          What this tool does not do
        </h3>
        <ul className="mt-3 space-y-2">
          {limitations.map((limitation) => (
            <li key={limitation} className="flex gap-2 text-sm">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-info" />
              <span className="measure">{limitation}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg border border-border-default bg-surface p-4 text-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        <span className="measure">{privacyNote}</span>
      </p>

      {sources && sources.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-base font-medium">Method sources</h3>
          <ul className="mt-2 space-y-1">
            {sources.map((source) => (
              <li key={source.url} className="text-sm">
                <a
                  href={source.url}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  className="text-brand underline underline-offset-2 hover:no-underline"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
