/**
 * Serialises JSON-LD safely.
 *
 * This is the single audited exception to the project's `react/no-danger` rule.
 * The payload is built exclusively from registry and content modules — never
 * from user input — and `<` is escaped so a value can never break out of the
 * script element.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
