import { Container } from '@/components/ui/container';

export default function ToolLoading() {
  return (
    <Container className="py-8">
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading tool…</span>
      </div>
      <div aria-hidden="true" className="space-y-6">
        <div className="h-4 w-48 rounded bg-surface-sunken" />
        <div className="h-10 w-72 max-w-full rounded bg-surface-sunken" />
        <div className="h-5 w-96 max-w-full rounded bg-surface-sunken" />
        <div className="h-64 w-full rounded-xl bg-surface-sunken" />
      </div>
    </Container>
  );
}
