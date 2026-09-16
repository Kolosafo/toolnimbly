import { ShieldCheck } from 'lucide-react';

/**
 * Shown on every tool whose processing is local (spec §5.2). The claim is
 * specific and verifiable rather than a generic "100% secure" assurance, which
 * §8.5 explicitly forbids.
 */
export function PrivacyBadge({ detail }: { detail?: string }) {
  return (
    <p className="inline-flex items-start gap-2 rounded-md border border-success-border bg-success-surface px-3 py-2 text-sm">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
      <span>
        <span className="font-medium">Runs in your browser.</span>{' '}
        {detail ?? 'Nothing you enter here is uploaded to a server.'}
      </span>
    </p>
  );
}
