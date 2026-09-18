# ADR 0007 — Measure layout by what the user experiences, not by `scrollWidth`

**Status:** accepted · **Date:** 2026-09-18

## Context

Spec §3 requires no horizontal page overflow at 320 CSS pixels. The obvious
test is:

```js
document.documentElement.scrollWidth > document.documentElement.clientWidth
```

Run across four browsers, that assertion failed on WebKit for
`/tools/calorie-calculator`, reporting a 118px overflow. Chromium reported
none on the same markup.

Tracing the element chain showed the two browsers agreed all the way down: the
formula block's `<pre>` sits inside a container with `overflow-x: auto`, and in
both browsers that container is correctly 288px wide with its content clipped
and scrollable. The difference is only in what `scrollWidth` reports on an
*ancestor*: WebKit includes the overflowing content of a descendant scroll
container, Chromium does not.

Checking directly, neither browser lets the user scroll the page sideways.
There was no user-visible defect — the test was measuring a proxy that is not
comparable across engines.

Separately, `body { overflow-x: hidden }` means a genuinely mispositioned
control would be silently clipped rather than causing a visible scrollbar. So
the naive test could also produce a false *pass*.

## Decision

Assert the two things the requirement actually means:

1. **The page does not scroll sideways.** Attempt `window.scrollTo(400, 0)` and
   confirm `scrollX` did not move.
2. **No interactive control sits outside the viewport.** Walk every button,
   link, input, select and textarea; ignore any inside a horizontal scroller,
   because those are reachable by scrolling that container — the documented
   behaviour for wide tables (§5.4) — and fail on anything else whose bounding
   box falls outside.

The same measurement is used for the 200% zoom check.

## Consequences

- The test is comparable across Chromium, Firefox, WebKit and mobile Chrome,
  and runs against all 40 routes rather than a sample of four.
- The second check is strictly stronger than the original: it catches a control
  clipped out of reach by `overflow-x: hidden`, which `scrollWidth` alone would
  have reported as a pass.
- It is slower, because it walks the DOM on every route. That is acceptable for
  a check that runs once per browser.

## Real defects this process found

Worth recording, because the test was not merely relaxed:

- Both business tools overflowed by 8px at 320px. A grid item defaults to
  `min-width: auto`, so the file input set the column's minimum and widened the
  page. Fixed with `min-w-0` on both columns.
- The UUID page overflowed by 14px in Firefox only. The worked example contains
  an unbroken 36-character UUID, and `overflow-wrap: break-word` does not reduce
  an element's min-content width — only `anywhere` does. Fixed across the
  worked-example and result-row components.
- `upgrade-insecure-requests` in the production CSP broke every WebKit test: it
  upgraded asset requests on a plain-HTTP server and the page never loaded. The
  directive is now emitted only when the canonical origin is HTTPS, which also
  prevents the same failure on a self-hosted HTTP deployment.
