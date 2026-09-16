import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/navigation/breadcrumbs';
import { Container } from '@/components/ui/container';
import { legalDetailsConfigured } from '@/lib/config/site';

/**
 * Shared shell for the four editorial and legal pages. Keeping the typography
 * and the "not yet configured" notice in one place means the individual pages
 * contain only their own content.
 */
export function LegalPage({
  title,
  intro,
  updated,
  children,
  path,
  showConfigurationNotice = false,
}: {
  title: string;
  intro: string;
  updated?: string;
  path: string;
  children: ReactNode;
  showConfigurationNotice?: boolean;
}) {
  return (
    <Container width="narrow" className="py-6 sm:py-8">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: '/' },
          { name: title, path },
        ]}
      />

      <header className="mt-4">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-4 text-lg text-muted">{intro}</p>
        {updated ? (
          <p className="mt-3 text-sm text-subtle">
            Last updated <time dateTime={updated}>{formatDate(updated)}</time>
          </p>
        ) : null}
      </header>

      {showConfigurationNotice && !legalDetailsConfigured ? (
        <p className="mt-6 rounded-lg border border-warning-border bg-warning-surface p-4 text-sm">
          <strong className="font-semibold">Deployment notice:</strong> the operating legal entity
          and governing jurisdiction have not been configured for this deployment. Set{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_LEGAL_ENTITY</code> and{' '}
          <code className="font-mono text-xs">NEXT_PUBLIC_JURISDICTION</code> before treating this
          page as final.
        </p>
      ) : null}

      <div className="mt-8 space-y-8">{children}</div>
    </Container>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  const id = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold">
        {heading}
      </h2>
      <div className="mt-3 space-y-3 text-muted [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_li]:leading-relaxed [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
