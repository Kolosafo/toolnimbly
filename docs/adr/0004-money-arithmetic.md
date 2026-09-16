# ADR 0004 — Money uses exact decimal arithmetic

**Status:** accepted · **Date:** 2026-09-16

## Context

Invoices and receipts must reconcile. IEEE 754 binary floating point cannot
represent 0.1 exactly, so `0.1 + 0.2 === 0.30000000000000004`. Accumulated over
line items, discounts and tax, that produces totals that are a cent out and do
not match between the screen and the generated PDF.

## Decision

All monetary values in the business document tools are held and combined using
`big.js`, an exact arbitrary-precision decimal library (~3 KB). Rounding happens
exactly once, at the point of display, using the decimal convention of the
selected ISO 4217 currency — so JPY rounds to whole units and USD to cents.

Tax is applied **after** any document-level discount by default, which matches
standard practice in most jurisdictions. The taxable amount is shown explicitly
on the document so the order used is visible.

## Consequences

- On-screen totals, print output and PDF output are identical by construction,
  and this is asserted by output-parity tests.
- Calculators that display money (loan, mortgage, compound interest, salary) use
  ordinary double-precision arithmetic, which is correct for them: they produce
  estimates from continuous formulas, not ledgers that must balance. This
  distinction is deliberate and is documented in those modules.

## Alternatives rejected

- **Integer minor units**: correct, but percentage tax and discount require
  division, which reintroduces rounding decisions at every step. `big.js` keeps
  that logic in one audited place.
- **`decimal.js`**: a superset of what is needed here; `big.js` is smaller.
