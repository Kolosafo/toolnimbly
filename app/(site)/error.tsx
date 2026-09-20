'use client';

import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

/**
 * Route-level error boundary. The underlying message is never shown to users
 * (spec §5.6) — only a recovery path.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Logged to the console only. No user input, filename or form state is
    // included, and no error reporting endpoint is contacted by default.
    console.error('Route error', error.digest ?? error.message);
  }, [error]);

  return (
    <Container className="py-16">
      <p className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-warning uppercase">
        <TriangleAlert className="size-4" aria-hidden="true" />
        Something went wrong
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">This page could not be displayed</h1>
      <p className="measure mt-3 text-lg text-muted">
        The error was on our side, not yours. Nothing you entered was sent anywhere. Try again, and
        if it keeps happening, use another tool in the meantime.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 text-sm font-medium hover:bg-surface-sunken"
        >
          Go to the homepage
        </Link>
      </div>
    </Container>
  );
}
