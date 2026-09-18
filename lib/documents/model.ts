/**
 * The shared document model behind the invoice and receipt generators
 * (spec §6.29, §6.30, Appendix A).
 *
 * Both documents share this line-item and totals engine, so their arithmetic is
 * identical by construction. They differ in semantics — an invoice requests
 * payment, a receipt records one already made — and in which fields they show.
 */

import Big from 'big.js';

import type { CurrencyCode } from '@/lib/formatting/number';

import { money, percentOf, roundToCurrency, sumMoney, type Money } from './money';

export type LineItem = {
  id: string;
  description: string;
  /** Kept as strings so a partially typed value is never coerced to zero. */
  quantity: string;
  unitPrice: string;
};

export type AdjustmentKind = 'percent' | 'amount';

export type DocumentTotalsInput = {
  lineItems: readonly LineItem[];
  currency: CurrencyCode;
  discountKind: AdjustmentKind;
  discountValue: string;
  taxKind: AdjustmentKind;
  taxValue: string;
  /** Shipping, delivery or a service fee. Added after tax. */
  feeValue: string;
  /**
   * A tip or gratuity, calculated on the pre-tax subtotal.
   * Used by the receipt; the invoice leaves it empty.
   */
  tipKind?: AdjustmentKind;
  tipValue?: string;
  /** Amount already paid (invoice) or tendered (receipt). */
  paidValue: string;
};

export type LineTotal = {
  id: string;
  description: string;
  quantity: Money;
  unitPrice: Money;
  total: Money;
};

export type DocumentTotals = {
  lines: LineTotal[];
  subtotal: Money;
  discount: Money;
  /** Subtotal minus discount — the base tax is calculated on. */
  taxableAmount: Money;
  tax: Money;
  tip: Money;
  fee: Money;
  total: Money;
  paid: Money;
  /** Total minus paid. Negative means the payment exceeded the total. */
  balanceDue: Money;
  /** Paid minus total, floored at zero. The receipt's change figure. */
  change: Money;
  /** True when the amount tendered does not cover the total. */
  underpaid: boolean;
};

/**
 * Calculates every figure on the document.
 *
 * Order matters and is fixed deliberately (spec §6.29): tax is applied **after**
 * the document discount, because tax is due on what the customer actually pays.
 * The taxable amount is returned separately so the document can show it and the
 * order used is never implied.
 */
export function calculateTotals(input: DocumentTotalsInput): DocumentTotals {
  const lines: LineTotal[] = input.lineItems.map((item) => {
    const quantity = money(parseOrZero(item.quantity));
    const unitPrice = money(parseOrZero(item.unitPrice));
    return {
      id: item.id,
      description: item.description,
      quantity,
      unitPrice,
      total: quantity.times(unitPrice),
    };
  });

  const subtotal = sumMoney(lines.map((line) => line.total));

  const discount = applyAdjustment(subtotal, input.discountKind, input.discountValue);
  // A discount can never exceed the subtotal, which would invent money.
  const cappedDiscount = discount.gt(subtotal) ? subtotal : discount;

  const taxableAmount = subtotal.minus(cappedDiscount);
  const tax = applyAdjustment(taxableAmount, input.taxKind, input.taxValue);

  // A tip is conventionally calculated on the pre-tax subtotal.
  const tip =
    input.tipKind && input.tipValue
      ? applyAdjustment(subtotal, input.tipKind, input.tipValue)
      : new Big(0);

  const fee = money(parseOrZero(input.feeValue));
  const total = taxableAmount.plus(tax).plus(tip).plus(fee);
  const paid = money(parseOrZero(input.paidValue));

  const balanceDue = total.minus(paid);
  const change = paid.gt(total) ? paid.minus(total) : new Big(0);

  return {
    lines,
    subtotal,
    discount: cappedDiscount,
    taxableAmount,
    tax,
    tip,
    fee,
    total,
    paid,
    balanceDue,
    change,
    underpaid: paid.gt(0) && paid.lt(total),
  };
}

function applyAdjustment(base: Money, kind: AdjustmentKind, value: string): Money {
  const parsed = money(parseOrZero(value));
  if (parsed.lte(0)) return new Big(0);
  return kind === 'percent' ? percentOf(base, parsed) : parsed;
}

/** Treats an unparseable or empty field as zero for the running total. */
function parseOrZero(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '0';
  const normalised = trimmed.replace(/[^\d.\-]/g, '');
  return /^-?(\d+\.?\d*|\.\d+)$/.test(normalised) ? normalised : '0';
}

/**
 * Rounds every displayed figure once, so the document, the print view and the
 * generated PDF cannot disagree.
 *
 * Change and balance due are derived from the **rounded** total rather than
 * rounded from the exact one. This matters in practice: a receipt whose exact
 * total is 27.675 displays 27.68, so a customer handing over 30.00 expects 2.32
 * back. Rounding the exact change of 2.325 independently gives 2.33 and leaves
 * the till a cent short. Money changes hands on the figure printed, so that is
 * the figure the change must reconcile against.
 */
export function roundTotals(totals: DocumentTotals, currency: CurrencyCode): DocumentTotals {
  const round = (value: Money) => roundToCurrency(value, currency);

  const total = round(totals.total);
  const paid = round(totals.paid);

  return {
    lines: totals.lines.map((line) => ({ ...line, total: round(line.total) })),
    subtotal: round(totals.subtotal),
    discount: round(totals.discount),
    taxableAmount: round(totals.taxableAmount),
    tax: round(totals.tax),
    tip: round(totals.tip),
    fee: round(totals.fee),
    total,
    paid,
    balanceDue: total.minus(paid),
    change: paid.gt(total) ? paid.minus(total) : new Big(0),
    underpaid: paid.gt(0) && paid.lt(total),
  };
}

export function createLineItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: '1',
    unitPrice: '',
  };
}

/** True when a line has enough filled in to appear on the document. */
export function lineHasContent(item: LineItem): boolean {
  return item.description.trim() !== '' || item.unitPrice.trim() !== '';
}
