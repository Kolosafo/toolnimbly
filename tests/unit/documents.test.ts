import Big from 'big.js';
import { describe, expect, it } from 'vitest';

import {
  calculateTotals,
  roundTotals,
  type DocumentTotalsInput,
  type LineItem,
} from '@/lib/documents/model';
import {
  formatMoney,
  money,
  moneyToFixed,
  parseMoney,
  percentOf,
  roundToCurrency,
  sumMoney,
} from '@/lib/documents/money';

const line = (description: string, quantity: string, unitPrice: string): LineItem => ({
  id: `${description}-${quantity}-${unitPrice}`,
  description,
  quantity,
  unitPrice,
});

const base = (overrides: Partial<DocumentTotalsInput> = {}): DocumentTotalsInput => ({
  lineItems: [],
  currency: 'USD',
  discountKind: 'percent',
  discountValue: '',
  taxKind: 'percent',
  taxValue: '',
  feeValue: '',
  paidValue: '',
  ...overrides,
});

describe('exact decimal arithmetic', () => {
  it('avoids the floating-point error that motivates this module', () => {
    // The reason big.js is here at all.
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(money('0.1').plus('0.2').toString()).toBe('0.3');
  });

  it('matches the spec reference: 2 × 19.99 uses exact currency maths', () => {
    expect(money('19.99').times(2).toFixed(2)).toBe('39.98');
    // The naive version drifts.
    expect((19.99 * 2).toFixed(2)).toBe('39.98');
    expect(money('19.99').times(3).toFixed(2)).toBe('59.97');
  });

  it('sums many small amounts without drift', () => {
    const amounts = Array.from({ length: 100 }, () => money('0.01'));
    expect(sumMoney(amounts).toFixed(2)).toBe('1.00');

    // Float accumulation of the same values does drift.
    let float = 0;
    for (let i = 0; i < 100; i += 1) float += 0.01;
    expect(float).not.toBe(1);
  });

  it('computes percentages exactly', () => {
    expect(percentOf(money('1950'), money('10')).toFixed(2)).toBe('195.00');
    expect(percentOf(money('1755'), money('20')).toFixed(2)).toBe('351.00');
    expect(percentOf(money('22.50'), money('15')).toFixed(4)).toBe('3.3750');
  });
});

describe('money parsing', () => {
  it('accepts plain, grouped and symbol-prefixed input', () => {
    expect(parseMoney('19.99')?.toString()).toBe('19.99');
    expect(parseMoney('1,234.56')?.toString()).toBe('1234.56');
    expect(parseMoney('$1,234.56')?.toString()).toBe('1234.56');
    expect(parseMoney('  42  ')?.toString()).toBe('42');
  });

  it('handles a decimal comma', () => {
    expect(parseMoney('19,99')?.toString()).toBe('19.99');
    expect(parseMoney('1.234,56')?.toString()).toBe('1234.56');
  });

  it('returns null for unparseable input rather than silently zero', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('12..34')).toBeNull();
  });

  it('accepts negatives, which a credit line may need', () => {
    expect(parseMoney('-50')?.toString()).toBe('-50');
  });
});

describe('currency rounding and formatting', () => {
  it('rounds to the currency minor units', () => {
    expect(roundToCurrency(money('1.005'), 'USD').toFixed(2)).toBe('1.01');
    expect(roundToCurrency(money('1.004'), 'USD').toFixed(2)).toBe('1.00');
  });

  it('respects a zero-decimal currency', () => {
    // JPY has no minor unit, so it must round to whole yen.
    expect(roundToCurrency(money('1234.56'), 'JPY').toFixed(0)).toBe('1235');
    expect(moneyToFixed(money('1234.56'), 'JPY')).toBe('1235');
    expect(moneyToFixed(money('1234.56'), 'USD')).toBe('1234.56');
  });

  it('formats with the right symbol and decimals', () => {
    expect(formatMoney(money('1234.5'), 'USD', 'en-US')).toBe('$1,234.50');
    expect(formatMoney(money('1234'), 'JPY', 'en-US')).toBe('¥1,234');
  });

  it('degrades rather than throwing on an unknown currency', () => {
    expect(formatMoney(money('10'), 'ZZZ' as never, 'en-US')).toContain('10');
  });
});

describe('invoice totals', () => {
  it('matches the worked example published on the invoice page', () => {
    // 24 hours at 65.00, 6 hours at 65.00, 10% discount, 20% VAT.
    const totals = calculateTotals(
      base({
        lineItems: [line('Design', '24', '65.00'), line('Revisions', '6', '65.00')],
        discountKind: 'percent',
        discountValue: '10',
        taxKind: 'percent',
        taxValue: '20',
      }),
    );

    expect(totals.lines[0]?.total.toFixed(2)).toBe('1560.00');
    expect(totals.lines[1]?.total.toFixed(2)).toBe('390.00');
    expect(totals.subtotal.toFixed(2)).toBe('1950.00');
    expect(totals.discount.toFixed(2)).toBe('195.00');
    expect(totals.taxableAmount.toFixed(2)).toBe('1755.00');
    expect(totals.tax.toFixed(2)).toBe('351.00');
    expect(totals.total.toFixed(2)).toBe('2106.00');
  });

  it('applies tax after the discount, as the page states', () => {
    const afterDiscount = calculateTotals(
      base({
        lineItems: [line('Work', '1', '1950')],
        discountValue: '10',
        taxValue: '20',
      }),
    );
    expect(afterDiscount.total.toFixed(2)).toBe('2106.00');

    // Applying tax before the discount would give 2,145.00 — the figure the
    // page cites as the wrong answer.
    const taxFirst = money('1950').times('1.2').minus('195');
    expect(taxFirst.toFixed(2)).toBe('2145.00');
    expect(afterDiscount.total.toFixed(2)).not.toBe(taxFirst.toFixed(2));
  });

  it('supports a fixed-amount discount and tax', () => {
    const totals = calculateTotals(
      base({
        lineItems: [line('Item', '1', '100')],
        discountKind: 'amount',
        discountValue: '25',
        taxKind: 'amount',
        taxValue: '10',
      }),
    );
    expect(totals.taxableAmount.toFixed(2)).toBe('75.00');
    expect(totals.tax.toFixed(2)).toBe('10.00');
    expect(totals.total.toFixed(2)).toBe('85.00');
  });

  it('never lets a discount exceed the subtotal', () => {
    const totals = calculateTotals(
      base({
        lineItems: [line('Item', '1', '100')],
        discountKind: 'amount',
        discountValue: '500',
      }),
    );
    expect(totals.discount.toFixed(2)).toBe('100.00');
    expect(totals.taxableAmount.toFixed(2)).toBe('0.00');
    expect(totals.total.toFixed(2)).toBe('0.00');
  });

  it('adds a fee after tax', () => {
    const totals = calculateTotals(
      base({
        lineItems: [line('Item', '1', '100')],
        taxValue: '10',
        feeValue: '15',
      }),
    );
    expect(totals.tax.toFixed(2)).toBe('10.00');
    expect(totals.fee.toFixed(2)).toBe('15.00');
    expect(totals.total.toFixed(2)).toBe('125.00');
  });

  it('computes the balance due from a partial payment', () => {
    const totals = calculateTotals(
      base({ lineItems: [line('Item', '1', '500')], paidValue: '200' }),
    );
    expect(totals.total.toFixed(2)).toBe('500.00');
    expect(totals.paid.toFixed(2)).toBe('200.00');
    expect(totals.balanceDue.toFixed(2)).toBe('300.00');
    expect(totals.underpaid).toBe(true);
  });

  it('reports a zero balance when paid in full', () => {
    const totals = calculateTotals(
      base({ lineItems: [line('Item', '1', '500')], paidValue: '500' }),
    );
    expect(totals.balanceDue.toFixed(2)).toBe('0.00');
    expect(totals.underpaid).toBe(false);
  });

  it('handles an empty document without dividing by zero', () => {
    const totals = calculateTotals(base());
    expect(totals.subtotal.toFixed(2)).toBe('0.00');
    expect(totals.total.toFixed(2)).toBe('0.00');
    expect(totals.balanceDue.toFixed(2)).toBe('0.00');
  });

  it('treats a partially typed field as zero rather than NaN', () => {
    const totals = calculateTotals(
      base({ lineItems: [line('Item', '2', ''), line('Other', '', '50')] }),
    );
    expect(totals.subtotal.toFixed(2)).toBe('0.00');
    expect(Number.isNaN(Number(totals.total.toString()))).toBe(false);
  });

  it('handles fractional quantities', () => {
    const totals = calculateTotals(
      base({ lineItems: [line('Consulting', '2.5', '120')] }),
    );
    expect(totals.subtotal.toFixed(2)).toBe('300.00');
  });

  it('keeps many line items exact', () => {
    const items = Array.from({ length: 50 }, (_, index) =>
      line(`Item ${index}`, '3', '19.99'),
    );
    const totals = calculateTotals(base({ lineItems: items }));
    // 50 × 3 × 19.99 = 2,998.50
    expect(totals.subtotal.toFixed(2)).toBe('2998.50');
  });
});

describe('receipt totals', () => {
  it('matches the worked example published on the receipt page', () => {
    // 2 × 3.80, 1 × 8.50, 2 × 3.20; 8% sales tax; 15% tip; 30.00 cash.
    const totals = calculateTotals(
      base({
        lineItems: [
          line('Flat white', '2', '3.80'),
          line('Sandwich', '1', '8.50'),
          line('Pastry', '2', '3.20'),
        ],
        taxKind: 'percent',
        taxValue: '8',
        tipKind: 'percent',
        tipValue: '15',
        paidValue: '30.00',
      }),
    );

    expect(totals.lines[0]?.total.toFixed(2)).toBe('7.60');
    expect(totals.lines[1]?.total.toFixed(2)).toBe('8.50');
    expect(totals.lines[2]?.total.toFixed(2)).toBe('6.40');
    expect(totals.subtotal.toFixed(2)).toBe('22.50');
    expect(totals.tax.toFixed(2)).toBe('1.80');

    // The tip is calculated on the pre-tax subtotal: 15% of 22.50 = 3.375.
    const rounded = roundTotals(totals, 'USD');
    expect(rounded.tip.toFixed(2)).toBe('3.38');
    expect(rounded.total.toFixed(2)).toBe('27.68');

    // Change reconciles against the printed total, not the exact one. The
    // exact total is 27.675, so rounding the exact change of 2.325 would give
    // 2.33 and leave the till a cent short.
    expect(rounded.change.toFixed(2)).toBe('2.32');
    expect(rounded.paid.minus(rounded.total).toFixed(2)).toBe(rounded.change.toFixed(2));
  });

  it('always reconciles: tendered minus total equals the change shown', () => {
    // Swept across amounts whose exact totals land on a half-cent boundary,
    // which is where independent rounding diverges.
    for (const unitPrice of ['3.335', '6.665', '1.115', '9.995', '0.005']) {
      const rounded = roundTotals(
        calculateTotals(
          base({
            lineItems: [line('Item', '3', unitPrice)],
            taxValue: '8.25',
            paidValue: '50',
          }),
        ),
        'USD',
      );

      expect(
        rounded.paid.minus(rounded.total).toFixed(2),
        `unit price ${unitPrice}`,
      ).toBe(rounded.change.toFixed(2));
    }
  });

  it('balance due also reconciles against the printed total', () => {
    const rounded = roundTotals(
      calculateTotals(
        base({
          lineItems: [line('Item', '3', '3.335')],
          taxValue: '8.25',
          paidValue: '5',
        }),
      ),
      'USD',
    );
    expect(rounded.total.minus(rounded.paid).toFixed(2)).toBe(rounded.balanceDue.toFixed(2));
  });

  it('calculates the tip on the pre-tax subtotal, not the taxed total', () => {
    const totals = calculateTotals(
      base({
        lineItems: [line('Meal', '1', '100')],
        taxValue: '10',
        tipKind: 'percent',
        tipValue: '20',
      }),
    );
    // 20% of 100, not of 110.
    expect(totals.tip.toFixed(2)).toBe('20.00');
    expect(totals.total.toFixed(2)).toBe('130.00');
  });

  it('gives no change when the payment is short, and flags it', () => {
    const totals = calculateTotals(
      base({ lineItems: [line('Item', '1', '50')], paidValue: '20' }),
    );
    expect(totals.change.toFixed(2)).toBe('0.00');
    expect(totals.underpaid).toBe(true);
    expect(totals.balanceDue.toFixed(2)).toBe('30.00');
  });

  it('computes change exactly, so it reconciles against a till', () => {
    const totals = calculateTotals(
      base({ lineItems: [line('Item', '3', '6.66')], paidValue: '20' }),
    );
    expect(totals.total.toFixed(2)).toBe('19.98');
    expect(totals.change.toFixed(2)).toBe('0.02');
  });

  it('supports a fixed-amount tip', () => {
    const totals = calculateTotals(
      base({
        lineItems: [line('Meal', '1', '40')],
        tipKind: 'amount',
        tipValue: '7.50',
      }),
    );
    expect(totals.tip.toFixed(2)).toBe('7.50');
    expect(totals.total.toFixed(2)).toBe('47.50');
  });
});

describe('rounding for display', () => {
  it('rounds every figure once, so screen and PDF agree', () => {
    const totals = calculateTotals(
      base({
        lineItems: [line('Item', '3', '3.333')],
        taxValue: '7.5',
      }),
    );

    const rounded = roundTotals(totals, 'USD');

    // Each displayed figure is the rounded form of the exact value.
    expect(rounded.subtotal.toFixed(2)).toBe('10.00');
    expect(rounded.tax.toFixed(2)).toBe('0.75');
    expect(rounded.total.toFixed(2)).toBe('10.75');

    // And the PDF string matches the displayed one exactly.
    expect(moneyToFixed(rounded.total, 'USD')).toBe(rounded.total.toFixed(2));
  });

  it('keeps the components consistent with the total after rounding', () => {
    const totals = roundTotals(
      calculateTotals(
        base({
          lineItems: [line('A', '1', '10.005'), line('B', '1', '20.005')],
          taxValue: '10',
        }),
      ),
      'USD',
    );

    const rebuilt = totals.taxableAmount.plus(totals.tax).plus(totals.tip).plus(totals.fee);
    // Within one minor unit: each component is rounded independently, which is
    // how a real invoice is presented.
    expect(Number(rebuilt.minus(totals.total).abs().toString())).toBeLessThanOrEqual(0.01);
  });

  it('rounds to whole units for a zero-decimal currency', () => {
    const totals = roundTotals(
      calculateTotals(base({ lineItems: [line('Item', '1', '1234.56')] })),
      'JPY',
    );
    expect(totals.total.toFixed(0)).toBe('1235');
  });
});

describe('big.js rounding mode', () => {
  it('rounds half away from zero, the invoice convention', () => {
    expect(new Big('2.5').round(0).toString()).toBe('3');
    expect(new Big('0.125').round(2).toString()).toBe('0.13');
  });
});
