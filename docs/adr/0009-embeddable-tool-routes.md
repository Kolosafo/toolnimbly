# ADR 0009 — Embeddable tool routes, and the framing headers they relax

**Status:** accepted · **Date:** 2026-09-20

## Context

The SEO brief (§7) asks for an "embed this tool" feature: a snippet other sites
paste to run one of our tools in an iframe, carrying a link back to us. It is
described there as the highest-leverage backlink source on the site, and the
mechanism is built once for all 30 tools.

This conflicts directly with the site's framing posture. Every route currently
sends `X-Frame-Options: DENY` and `frame-ancestors 'none'`, which is correct for
a site nobody should be framing, and fatal to a feature whose entire purpose is
being framed.

Three things had to be decided: where the backlink lives, which headers change
and on which routes, and whether the embed pages are indexable.

## Decision

**1. The backlink lives in the host page, not in the iframe.**

The snippet is static HTML with no JavaScript: an `<iframe>`, followed by a
plain `<a href>` pointing at the canonical tool page. That anchor sits in the
*other site's* markup, which is the only place it is worth anything. A link
inside our own iframe points from our domain to our domain — an internal link —
and iframe content is not attributed to the framing page. A link injected by
script is not reliably crawled. Both alternatives would produce a feature that
looks finished and earns nothing.

The embed page also shows a credit link, but that one is for the human looking
at it, not for a crawler.

**2. Framing headers are relaxed on `/embed/*` only.**

`securityHeaders({ embeddable: true })` sets `frame-ancestors *` and omits both
`X-Frame-Options` and `Cross-Origin-Opener-Policy`.

`X-Frame-Options` has to be omitted rather than loosened: the header has no
"any origin" value, and a browser enforces whichever of it and `frame-ancestors`
is stricter, so sending `DENY` alongside a permissive CSP silently defeats the
CSP. `Cross-Origin-Opener-Policy: same-origin` severs the embed from its framing
page, so it goes too.

The catch-all rule excludes `/embed` explicitly, with
`source: '/:path((?!embed$|embed/).*)'`, rather than relying on rule order.
Next.js applies *every* matching `headers()` rule, so a plain `/:path*`
catch-all would re-add the headers the embed rule just dropped.

**3. Embed routes are `noindex`, canonicalised to the tool page, and kept out
of the sitemap** — but remain crawlable, so Google can read the `noindex`.

## Why permitting any ancestor is acceptable here

Allowing arbitrary framing is normally a clickjacking risk. It is not one for
these routes specifically, because an embed page has nothing to steal and
nothing privileged to trigger:

- no session, no cookie, no account, no stored server-side state;
- every tool runs entirely in the browser, so a clickjacked click can at most
  operate a calculator the visitor could have operated anyway;
- `connect-src 'self'` still applies, so a framed tool cannot transmit anything
  to anyone, including to the site framing it.

The remaining risk is reputational rather than technical — someone framing a
tool inside misleading surroundings — and that is not a risk a header prevents.

## Consequences

- The root layout no longer carries the site chrome. Header, footer, skip link
  and site-wide structured data moved into `SiteChrome`, applied by the
  `(site)` route group, so the embed routes can opt out. A root layout applies
  to every route and cannot exempt a subtree.
- `app/not-found.tsx` sits outside that group (Next.js only uses a root
  `not-found` for unmatched paths), so it renders `SiteChrome` itself.
- Iframe height is fixed per tool, in `lib/embed/snippet.ts`. An iframe cannot
  size itself to its content across origins, and the snippet carries no script
  to negotiate a height — a deliberate trade, since adding script would
  undermine decision 1 and make the snippet harder to trust.
- `?theme=light|dark` is applied by an inline script reading the query string,
  not by reading `searchParams` in the page, which would opt the route out of
  static prerendering.

## Alternatives rejected

- **A JavaScript widget instead of an iframe.** Better height behaviour, worse
  on every other axis: it executes our code in someone else's page, and the
  credit link would be script-injected and therefore uncrawlable.
- **Relaxing `frame-ancestors` site-wide.** Unnecessary; the tool pages gain
  nothing from being framable and lose a real protection.
- **Blocking `/embed/` in robots.txt.** Would prevent Google from reading the
  `noindex`, which is the opposite of the intent.
