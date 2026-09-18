# ADR 0008 — Change and balance derive from the rounded total

**Status:** accepted · **Date:** 2026-09-18

## Context

Invoice and receipt figures are held as exact decimals (ADR 0004) and rounded
once for display. The question is *which* value the derived figures — change
given, balance due — are computed from.

The receipt worked example makes the problem concrete. Three items total 22.50,
8% tax is 1.80, and a 15% tip on the pre-tax subtotal is 3.375. The exact total
is therefore **27.675**, which displays as **27.68**.

A customer hands over 30.00. Rounding the exact change independently gives
`30.00 − 27.675 = 2.325 → 2.33`. But the customer has just read a total of
27.68 on the receipt and expects **2.32** back. Handing over 2.33 leaves the
till a cent short, and the receipt does not reconcile against itself.

## Decision

Derive change and balance due from the **rounded** total and the **rounded**
amount tendered:

```
change      = round(paid) − round(total)   when positive
balanceDue  = round(total) − round(paid)
```

rather than rounding the exact difference.

The principle: money changes hands on the figure that is printed, so every
figure derived from a transaction must reconcile against the printed one, not
against a more precise value nobody saw.

## Consequences

- A receipt always satisfies `tendered − total = change` as displayed. A sweep
  over unit prices that land on half-cent boundaries asserts this.
- The same holds for an invoice's balance due.
- The displayed components can differ from the displayed total by up to one
  minor unit when each is rounded independently. That is how printed invoices
  have always worked, and the alternative — forcing components to sum exactly —
  would misstate at least one of them.
- Zero-decimal currencies follow the same rule at their own precision: JPY
  reconciles to the whole yen.
