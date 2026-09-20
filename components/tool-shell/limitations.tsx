import { Info, Lock } from 'lucide-react';

export function Limitations({
  limitations,
  privacyNote,
}: {
  limitations: readonly string[];
  privacyNote: string;
}) {
  return (
    <section aria-labelledby="limitations-heading">
      <h2 id="limitations-heading" className="text-xl font-semibold">
        Limitations and privacy
      </h2>

      <div className="border-info-border bg-info-surface mt-4 rounded-lg border p-5">
        <h3 className="flex items-center gap-2 text-base font-medium">
          <Info className="text-info size-4 shrink-0" aria-hidden="true" />
          What this tool does not do
        </h3>
        <ul className="mt-3 space-y-2">
          {limitations.map((limitation) => (
            <li key={limitation} className="flex gap-2 text-sm">
              <span aria-hidden="true" className="bg-info mt-2 size-1 shrink-0 rounded-full" />
              <span className="measure">{limitation}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-border-default bg-surface mt-4 flex items-start gap-2 rounded-lg border p-4 text-sm">
        <Lock className="text-success mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span className="measure">{privacyNote}</span>
      </p>
    </section>
  );
}
