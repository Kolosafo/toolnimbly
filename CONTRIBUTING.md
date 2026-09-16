# Contributing

## Getting set up

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Node 22.11 or later (see `.nvmrc`) and pnpm 10 or later.

## Before opening a pull request

```bash
pnpm verify      # lint + typecheck + unit tests + production build
pnpm test:e2e    # end-to-end suite
```

CI runs the same checks. A pull request that fails any of them will not be
merged.

## Adding a tool

Adding a tool is three mechanical changes, and the registry validation fails if
any of them is missing:

1. **Registry entry** in `lib/registry/tools.ts` — slug, category, title,
   description, curated `relatedSlugs`, icon and `componentKey`.
2. **Content module** in `content/tools/<slug>.ts`, registered in
   `content/index.ts`. See the content standards below.
3. **Interactive component** in `components/tools/<category>/`, registered in
   `components/tools/tool-components.tsx` as a dynamic import.

Then add unit tests for the domain logic and at least one end-to-end journey.

A production build **fails** while a registry entry has no implementation. That
is deliberate: placeholder panels must never reach users.

## Code standards

- **Domain logic is pure.** Formulas, date arithmetic, parsing and validation
  live in `lib/` as side-effect-free functions with no React dependency. They
  are unit tested directly.
- **Server Components by default.** Only the interactive panel is a Client
  Component, and it is dynamically imported so heavy libraries stay in
  route-scoped chunks.
- **Never widen a shared bundle.** If a change pulls `pdfjs-dist` or `pdf-lib`
  into the shared chunk, `pnpm analyze` will show it and the change must be
  reworked.
- **No user content in analytics, ever.** See the event contract in
  `lib/analytics/`. Adding a field to an event requires review.
- **No `dangerouslySetInnerHTML`.** The rule is enforced by ESLint. The two
  existing exceptions are audited and never receive user input.
- **Native elements before ARIA.** Reach for `<button>`, `<details>`, `<dialog>`
  and real labels before adding roles.

## Content standards

Each content module must be written for its specific tool. Specifically:

- a 40–100 word introduction that is not a restatement of the title;
- three to five genuine usage steps;
- at least one worked example with **numbers that have been verified against the
  implementation** — reviewers check these;
- the formula or processing method, cited to a source where a standard exists;
- honest limitations, including the unflattering ones;
- three to six FAQs with original answers of real substance.

Do not write filler to reach a length. Do not repeat a paragraph across tools.
Do not create a second page for a keyword variant of an existing tool.

Never claim "100% secure", "perfect accuracy", "best", or a guaranteed
compression outcome.

## Review dates

`updatedAt` in the registry is a record of an actual review of that tool and its
copy. Do not bump it to make a page look fresh.

## Dependencies

Changes to dependencies that touch image or PDF parsing, cryptography,
analytics, advertising or the CSP require human review. Prefer a short, clear
Web API implementation over a dependency for anything security-sensitive.

## Test fixtures

Every file in `tests/fixtures/` must be synthetic or explicitly licensed, and
must contain no personal data. See `SECURITY.md`.
