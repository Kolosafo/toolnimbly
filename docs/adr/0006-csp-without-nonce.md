# ADR 0006 — A static-compatible CSP, without a nonce

**Status:** accepted · **Date:** 2026-09-16
**Supersedes:** the nonce-based policy described in the original §7.9 plan

## Context

Two requirements in the specification are in direct conflict:

- **§7.1** — all 30 tool pages are prerendered at build time via
  `generateStaticParams()`.
- **§7.9** — set a restrictive CSP, minimising `unsafe-inline` through
  nonces or hashes.

A nonce must be unique per response. Next.js injects one by reading the
`Content-Security-Policy` request header during rendering. On a **prerendered**
page there is no request at render time — the HTML is produced once at build and
then served unchanged — so the nonce can never reach the markup.

The first implementation shipped a nonce-based policy anyway. The result, caught
by the end-to-end suite against a production build, was that **every page was
broken in production**:

1. the CSP header carried a fresh `'nonce-…'` on each response;
2. the prerendered HTML carried no `nonce` attribute on any script;
3. `'strict-dynamic'` causes a browser to ignore `'self'`, so *every* script —
   including same-origin chunks — was refused;
4. React never hydrated, so its streamed Suspense content stayed inside
   `<div hidden id="S:0">` permanently and the tools were invisible.

Hashing is not a workable alternative either: Next.js emits inline RSC
flight-data scripts whose contents differ per page and change on every build.

## Decision

Keep static prerendering, and use a policy that is correct for statically served
HTML:

```
script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
```

with no nonce, no `'strict-dynamic'` and no `'unsafe-eval'` in production.

`'unsafe-inline'` and a nonce are mutually exclusive in practice: a browser
ignores `'unsafe-inline'` whenever a nonce or hash is present. Shipping both is
the exact failure above, so the nonce machinery has been removed rather than
left in place looking protective.

Headers moved from the proxy to `next.config.ts`, so they also apply to static
assets and survive a static-export deployment (§13.2).

## Consequences

**What is still enforced**

- `script-src 'self'` — no third-party script can execute. This is the
  substantive control, and it costs nothing because the product deliberately
  embeds no third-party scripts (§8.6).
- `connect-src 'self'` — no request to any other origin is possible, which is
  what makes the local-processing promise enforceable by the browser rather than
  only by our code.
- No `'unsafe-eval'` in production. `'wasm-unsafe-eval'` permits WebAssembly
  compilation for pdf.js and nothing more.
- `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`,
  `form-action 'self'`.

**What is given up**

`'unsafe-inline'` for scripts means the CSP would not, by itself, stop an
injected inline `<script>`. The compensating controls are that no such injection
path exists: `react/no-danger` is enforced repo-wide with two audited exceptions
that never receive user input (§7.9), all user text renders as text nodes, there
is no server-rendered user content, and there is no database or user-generated
content of any kind.

**Regression guard**

`tests/e2e/security.spec.ts` loads production pages, fails on any CSP violation
reported by the browser, and asserts that React actually hydrated. That test is
what turns this from a one-off fix into a property of the build.

## Alternatives rejected

- **Render tool pages dynamically to obtain a nonce.** Sacrifices §7.1, slows
  every page, and adds server cost for a site whose pages are pure static
  content.
- **Hash every inline script.** Not stable: RSC flight data differs per page and
  per build.
- **Keep the nonce and drop `'strict-dynamic'`.** Does not help — a nonce alone
  still causes the browser to ignore `'unsafe-inline'`, and the prerendered
  scripts still carry no nonce attribute.
