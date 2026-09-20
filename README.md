# ToolNimbly

Thirty browser utilities — calculators, text tools, image editors, PDF tools and
business documents. Everything runs on the user's device: there is no upload
endpoint in this product, so files and text never reach a server.

Built to the specification in `NEXTJS_UTILITY_SITE_SPEC.md`.

---

## The local-processing promise

This is the product's central claim, so it is worth being precise about what it
means and how it is enforced.

- **There is no file upload endpoint.** Not disabled, not authenticated —
  absent. Decoding, transforming, encoding, PDF parsing and document assembly
  all happen in the browser.
- **`connect-src 'self'`** in the Content Security Policy means no request to
  another origin is possible, so the browser enforces the promise rather than
  only our code doing so.
- **No third-party resources.** No external fonts, no analytics script, no CDN.
  pdf.js's worker, fonts and CMaps are served from our own origin.
- **`tests/e2e/privacy.spec.ts`** enters distinctive sentinel values into every
  tool, inspects every request URL, header and body, and fails on any
  appearance, any remote origin, or any large request body.

What that does not cover: a hosting provider still sees ordinary page requests
in its logs. Those cannot contain tool content, because tool content is never
part of a request.

---

## The 30 routes

| Category             | Tools                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Calculators**      | [percentage](/tools/percentage-calculator) · [loan](/tools/loan-calculator) · [mortgage](/tools/mortgage-calculator) · [compound interest](/tools/compound-interest-calculator) · [salary](/tools/salary-calculator) · [age](/tools/age-calculator) · [date difference](/tools/date-difference-calculator) · [BMI](/tools/bmi-calculator) · [calorie](/tools/calorie-calculator) |
| **Text & developer** | [QR code](/tools/qr-code-generator) · [password](/tools/password-generator) · [UUID](/tools/uuid-generator) · [word counter](/tools/word-counter) · [character counter](/tools/character-counter) · [case converter](/tools/case-converter)                                                                                                                                      |
| **Images**           | [compressor](/tools/image-compressor) · [JPG compressor](/tools/jpg-compressor) · [PNG compressor](/tools/png-compressor) · [resizer](/tools/image-resizer) · [cropper](/tools/image-cropper) · [JPG to PNG](/tools/jpg-to-png) · [PNG to JPG](/tools/png-to-jpg)                                                                                                                |
| **PDF**              | [image to PDF](/tools/image-to-pdf) · [PDF to JPG](/tools/pdf-to-jpg) · [JPG to PDF](/tools/jpg-to-pdf) · [compressor](/tools/pdf-compressor) · [merger](/tools/pdf-merger) · [splitter](/tools/pdf-splitter)                                                                                                                                                                    |
| **Business**         | [invoice](/tools/invoice-generator) · [receipt](/tools/receipt-generator)                                                                                                                                                                                                                                                                                                        |

Plus five category pages, a homepage, and About, Privacy, Terms and Contact.

---

## Getting started

Requires Node 22.11+ (see `.nvmrc`) and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local
pnpm dev                     # http://localhost:3000
```

`predev` and `prebuild` copy the pdf.js worker, standard fonts, CMaps and wasm
into `public/pdfjs/`. They are gitignored and regenerated on demand.

### Commands

| Command                     | What it does                                       |
| --------------------------- | -------------------------------------------------- |
| `pnpm dev`                  | Development server                                 |
| `pnpm build` / `pnpm start` | Production build and server                        |
| `pnpm lint`                 | ESLint                                             |
| `pnpm typecheck`            | TypeScript, strict                                 |
| `pnpm test`                 | Unit and component tests (Vitest)                  |
| `pnpm test:e2e`             | End-to-end tests (Playwright)                      |
| `pnpm verify`               | lint + typecheck + test + build                    |
| `pnpm check:bundles`        | Fails if a heavy library reaches the shared bundle |
| `pnpm analyze`              | Bundle analyser                                    |

Cross-browser runs: `E2E_ALL_BROWSERS=true pnpm test:e2e`.

---

## Configuration

Everything configurable lives in `lib/config/`. See `.env.example` for the full
list; the ones that matter:

| Variable                         | Purpose                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`           | Canonical origin. Drives canonicals, sitemap, robots and Open Graph. A production build without it logs a loud warning. |
| `NEXT_PUBLIC_LEGAL_ENTITY`       | Registered entity named in Terms and Privacy. Blank shows a "not configured" notice on the legal pages.                 |
| `NEXT_PUBLIC_JURISDICTION`       | Governing law named in Terms.                                                                                           |
| `NEXT_PUBLIC_CONTACT_EMAIL`      | Contact and security address.                                                                                           |
| `NEXT_PUBLIC_ANALYTICS_ENABLED`  | Enables the configured provider. Off by default.                                                                        |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | Use `ga4` for the consent-gated GA4 integration, or `none`.                                                             |
| `NEXT_PUBLIC_ANALYTICS_SITE_ID`  | GA4 measurement ID such as `G-ABC123DEF4`.                                                                              |
| `NEXT_PUBLIC_ADS_ENABLED`        | Off. `AdSlot` renders nothing while disabled.                                                                           |

**Still needed from the owner before launch** (spec Appendix C): the registered
legal entity, the governing jurisdiction, and a decision on analytics. The
legal pages display an unmistakable notice until the first two are set.

---

## Architecture

```
app/          routes; one dynamic tool route prerenders all 30 pages
  (site)/     everything with the site chrome — tools, hubs, guides, legal
  embed/      chrome-free, framable copies of each tool
components/   shell, forms, files, and one directory per tool family
content/      one reviewed editorial module per tool, plus the guides
lib/          pure domain logic — calculators, text, image, pdf, documents
scripts/      pdf.js asset copying, bundle checks
tests/        unit, e2e, and synthetic fixtures
docs/adr/     the decisions worth recording
```

**A typed registry drives everything.** `lib/registry/tools.ts` is the single
source of truth for routing, metadata, the sitemap, navigation, search and
related links. Invariants in `lib/registry/validate.ts` run both in the test
suite and during `next build`.

**Domain logic is pure.** Formulas, date arithmetic, parsing and validation are
side-effect-free functions with no React dependency, unit tested directly.

**Server Components by default.** Only the interactive panel is a Client
Component, dynamically imported so heavy libraries stay route-scoped.

### Embedding (`/embed/[slug]`)

Every tool page has an **Embed this tool** button producing a paste-ready
snippet: an iframe pointing at `/embed/<slug>`, followed by a plain `<a href>`
back to the canonical tool page.

That anchor is the point of the feature, and it is deliberately in the _host_
page rather than inside the iframe — a link inside our own frame is an internal
link and earns nothing. The snippet contains no JavaScript for the same reason.

The embed routes are the only ones that permit framing: they send
`frame-ancestors *` and omit `X-Frame-Options`, while every other route keeps
`DENY`. They are `noindex`, canonicalised to the tool page, and excluded from
the sitemap. See `docs/adr/0009-embeddable-tool-routes.md`.

### Guides (`/guides/[slug]`)

Seven supporting articles, one to two per cluster, linked both ways: a hub
lists its guides, a guide links the tools it supports, and each tool page shows
the guides that reference it. A guide declares its tools in
`lib/registry/guides.ts`, so there is one list rather than two to keep in step.

Figures quoted in a guide are recomputed from the same library the tool uses,
in `tests/unit/guide-content.test.ts`. Prose and implementation cannot drift
apart silently.

### Adding a tool

Three mechanical changes; registry validation fails if any is missing.

1. An entry in `lib/registry/tools.ts`
2. A content module in `content/tools/`, registered in `content/index.ts`
3. A component registered in `components/tools/tool-components.tsx`

A production build **fails** while a registry entry has no implementation, so a
placeholder cannot reach users.

---

## Dependencies

| Package         | Why                            |
| --------------- | ------------------------------ |
| `next`, `react` | Framework                      |
| `pdf-lib`       | PDF assembly and page copying  |
| `pdfjs-dist`    | PDF rendering                  |
| `qrcode`        | QR encoding, locally           |
| `fflate`        | ZIP for batch downloads        |
| `big.js`        | Exact decimal money (ADR 0004) |
| `lucide-react`  | Icons, imported individually   |
| `tailwindcss`   | Styling                        |

Web Crypto is used directly for passwords and UUIDs rather than a library: for
security-sensitive randomness, a short audited implementation beats a
dependency.

---

## Known limitations

Stated here and on the tool pages themselves, rather than discovered by users.

- **PDF compression rarely achieves much safely.** Structure optimisation
  cannot recompress embedded images or fonts, which is where most of a PDF's
  size sits. Rasterising saves more but destroys selectable text, links, form
  fields and accessibility tagging. Both modes report the real byte change and
  say when the output got larger. See ADR 0005.
- **Browsers encode differently.** The same quality setting yields slightly
  different file sizes in Chrome, Firefox and Safari. Tests assert format
  validity and dimensions, not byte equality.
- **Lossless PNG optimisation often saves nothing.** The browser's PNG encoder
  is not aggressive. The tool says so rather than inventing a saving.
- **No OCR**, no PDF-to-Word, no password removal, no HEIC unless the browser
  decodes it natively.
- **Unicode word counting breaks on hyphens**, so `well-known` counts as two
  words where a word processor counts one. Documented on the page.
- **The CSP carries `unsafe-inline` for scripts.** A nonce cannot work on
  prerendered HTML; see ADR 0006 for the reasoning and the compensating
  controls.
- **Limits**: 20 MB and 40 MP per image, 100 MB and 500 pages per PDF, 10 PDFs
  per merge, 20 files per batch. All in `lib/config/limits.ts`.

---

## Testing

| Suite         | Covers                                                                                                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit          | Every formula with its reference cases and boundaries; date arithmetic under a DST-observing timezone; Unicode segmentation; cryptographic randomness and distribution; page-range parsing; money arithmetic; registry invariants |
| End-to-end    | A journey per tool family, keyboard operation, 320 px layout on every route, no-JavaScript rendering, security headers and CSP violations                                                                                         |
| Accessibility | axe over 16 routes plus dialog, result and error states; 200 % zoom; touch targets                                                                                                                                                |
| Privacy       | Sentinel values through every tool, checking every request                                                                                                                                                                        |
| Output parity | Generated PDFs re-opened and their figures compared against the interface                                                                                                                                                         |

Fixtures in `tests/fixtures/` are generated by the two `generate*.mjs` scripts
and are entirely synthetic — see `SECURITY.md`.

---

## Deployment

1. Connect the repository; Next.js settings are detected.
2. Set `NEXT_PUBLIC_SITE_URL` to the production origin. **Do not** set it for
   preview deployments — they must stay noindexed.
3. Set `NEXT_PUBLIC_LEGAL_ENTITY` and `NEXT_PUBLIC_JURISDICTION`.
4. Attach the domain, enforce HTTPS, redirect alternate hosts to the canonical
   one.
5. Confirm the security headers and CSP on the deployed response.
6. Run the E2E suite against the preview, then promote.

### After each release

- Load one page from each tool family and complete one download from each.
- Watch the network panel during processing: no request should carry content.
- Check `/robots.txt`, `/sitemap.xml`, canonical host, Open Graph image, a 404.
- Confirm preview URLs were not indexed.
- Compare the shared bundle against the previous release (`pnpm check:bundles`).

---

## Troubleshooting

**PDF pages render with missing glyphs.** `public/pdfjs/` is missing or stale.
Run `pnpm prepare:pdfjs`. pdf.js needs `standardFontDataUrl` for the standard
14 fonts.

**Scripts blocked by CSP.** Check `lib/config/security-headers.ts`. A nonce
cannot work here — see ADR 0006. In development the policy is deliberately
looser because Next.js's hot reload requires `eval`.

**`upgrade-insecure-requests` breaking a local production server.** It is only
emitted when `NEXT_PUBLIC_SITE_URL` is `https://`. Over plain HTTP, WebKit
upgrades every asset request and the page never loads.

**`Internal: NoFallbackError` in the server log.** Benign. Next.js logs this
once per request to an unknown path under a dynamic route that has
`dynamicParams = false` — which is every 404 here, by design. The response is
still a correct 404; the E2E suite asserts that.

**A tool fails on a large file.** Limits are in `lib/config/limits.ts` and are
quoted verbatim in the error message.

**Downloads do nothing.** Object URLs are created and revoked in
`lib/download/file.ts`. The revoke is deferred a tick because Safari needs the
URL alive until the click is processed.

---

## Auditing the tools

`.claude/agents/tool-auditor.md` defines an exploratory QA agent. It drives the
real tools in a real browser, checks each page's published worked example
against what the tool actually does, probes edge cases and error states, and
reports defects. It does not edit source.

```bash
pnpm build && pnpm start --port 3200      # give it something to test
```

Then ask Claude Code to audit the tools; it will use the agent. Shard by
category for depth — calculators, text and image, PDF and business.

The agent exists because the automated suite only checks what its author
thought to check. An exploratory pass finds the awkward input, the second
click, and the claim on the page that nobody verified.

## Documentation

- `CONTRIBUTING.md` — coding, testing and content standards
- `SECURITY.md` — threat model, CSP, and the no-sensitive-fixtures rule
- `docs/adr/` — decisions on local processing, the registry, date handling,
  money arithmetic, PDF compression modes, the CSP, cross-browser layout,
  document rounding and the embeddable routes
