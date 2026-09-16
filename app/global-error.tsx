'use client';

/**
 * Last-resort boundary for errors thrown in the root layout. It must render its
 * own <html> and <body> because the layout itself failed, so it deliberately
 * uses inline styles rather than the app stylesheet.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background: '#f7f8f9',
          color: '#14181f',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 1.25rem', lineHeight: 1.6 }}>
            ToolNimbly failed to load. Nothing you entered was sent anywhere. Reloading usually
            fixes it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              minHeight: '2.75rem',
              padding: '0 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#0e7490',
              color: '#ffffff',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Reload the page
          </button>
          {error.digest ? (
            <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#5b6472' }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
