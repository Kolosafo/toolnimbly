# Security Policy

## Reporting a vulnerability

Email **admin@toolnimbly.com** with "Security" in the subject line. Please
include enough detail to reproduce the issue, and allow a reasonable period for
a fix before public disclosure.

## Do not send sensitive fixtures

**Never attach real personal, financial, medical or identity documents to a
report, an issue, or a pull request.**

If a specific file triggers a bug, describe its characteristics — format, size,
page count, how it was produced, which feature it uses — rather than sending it.
Where a fixture is genuinely required, produce a synthetic one containing no
real data.

The same rule governs the repository: every file in `tests/fixtures/` must be
synthetic or explicitly licensed for redistribution, and must contain no
personal data. This is checked during review of any change that adds a fixture.

## Threat model summary

The application has no backend, no database, no authentication and no upload
endpoint, which removes most of the usual server-side attack surface. The
remaining risks and their mitigations:

| Risk | Mitigation |
|---|---|
| Malicious image or PDF exploiting a parser | Files are validated by signature and size before decode; parsing runs in workers; decoded pixel counts and page counts are capped before allocation; corrupt files must fail cleanly |
| Memory exhaustion from a large but valid file | Centralised limits in `lib/config/limits.ts`, enforced before expensive work; concurrency capped at 1–2 jobs |
| XSS via a filename or user-entered document text | All user text renders as text nodes. `react/no-danger` is enabled repo-wide; the only exceptions are the JSON-LD serialiser and the pre-paint theme script, neither of which ever receives user input |
| Untrusted content in a download | Filenames are sanitised centrally; MIME type and extension are matched and asserted in tests |
| Third-party script compromise | Tool pages embed no third-party resources. CSP `connect-src` is `'self'`, so no outbound request to another origin is possible |
| Supply-chain risk in a parser | Dependencies are pinned by lockfile; changes affecting image/PDF parsing, cryptography, analytics, ads or CSP require human review |

## Content Security Policy

The CSP is applied by `next.config.ts` and is static-compatible: it carries no
nonce, because every page is prerendered at build time and a nonce must vary per
request. See [ADR 0006](docs/adr/0006-csp-without-nonce.md) for why, including
the production outage this caused when it was first implemented as a nonce
policy.

What the policy enforces:

- `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` — no third-party script
  can execute. `wasm-unsafe-eval` is required by pdf.js for WebAssembly image
  decoding and permits compilation only. There is no `unsafe-eval` in
  production.
- `connect-src 'self'` — no request to another origin is possible. This is what
  makes the local-processing promise enforceable by the browser and not only by
  our code.
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`,
  `form-action 'self'`, `worker-src blob:` for the image and PDF workers.

### The one framing exception

The `/embed/*` routes send `frame-ancestors *` and omit `X-Frame-Options`, so
other sites can embed a tool. Every other route keeps `frame-ancestors 'none'`
and `X-Frame-Options: DENY`.

Permitting any ancestor there is acceptable because an embed page has nothing to
steal and nothing privileged to trigger: no session, no cookie, no account, no
server-side state, and every tool runs entirely in the browser. `connect-src
'self'` still applies, so a framed tool cannot transmit anything to anyone —
including to the page framing it. The reasoning, and why `X-Frame-Options` must
be omitted rather than loosened, is in
`docs/adr/0009-embeddable-tool-routes.md`.

`'unsafe-inline'` for scripts is a real, accepted limitation. It is mitigated by
there being no injection path: `react/no-danger` is enforced repo-wide, all user
text renders as text nodes, and there is no server-rendered user content, no
database and no user-generated content.

## Cryptography

Password and UUID generation use `crypto.getRandomValues` and
`crypto.randomUUID` exclusively. `Math.random` is never used for any value that
must be unpredictable, and this is asserted by tests. Rejection sampling removes
modulo bias. Generated secrets are never stored, logged or transmitted.
