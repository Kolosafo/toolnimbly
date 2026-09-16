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

A nonce-based CSP is applied per request by `proxy.ts`. Production carries no
`unsafe-eval`. `wasm-unsafe-eval` is present because pdf.js compiles WebAssembly
for image decoding; it permits WebAssembly compilation only. `worker-src blob:`
is required for the image and PDF workers.

## Cryptography

Password and UUID generation use `crypto.getRandomValues` and
`crypto.randomUUID` exclusively. `Math.random` is never used for any value that
must be unpredictable, and this is asserted by tests. Rejection sampling removes
modulo bias. Generated secrets are never stored, logged or transmitted.
