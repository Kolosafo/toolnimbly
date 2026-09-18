import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import { buildDocumentPdf, type BuildDocumentInput } from '@/lib/documents/pdf';
import { calculateTotals, roundTotals, type LineItem } from '@/lib/documents/model';
import { formatMoney, moneyToFixed } from '@/lib/documents/money';
import { loadPdf } from '@/lib/pdf/document';

const line = (description: string, quantity: string, unitPrice: string): LineItem => ({
  id: `${description}-${quantity}`,
  description,
  quantity,
  unitPrice,
});

function buildInput(overrides: Partial<BuildDocumentInput> = {}): BuildDocumentInput {
  const totals = roundTotals(
    calculateTotals({
      lineItems: [line('Design work', '24', '65.00'), line('Revisions', '6', '65.00')],
      currency: 'USD',
      discountKind: 'percent',
      discountValue: '10',
      taxKind: 'percent',
      taxValue: '20',
      feeValue: '',
      paidValue: '',
    }),
    'USD',
  );

  return {
    meta: {
      kind: 'invoice',
      number: 'INV-001',
      issueDate: '2026-09-18',
      dueDate: '2026-10-18',
      currency: 'USD',
      notes: 'Thank you for your business.',
      terms: 'Payment due within 30 days.',
      logo: null,
    },
    from: {
      name: 'Studio Example',
      address: '1 Example Street\nExample City',
      email: 'hello@example.com',
      phone: '+1 555 0100',
      taxId: 'TAX-12345',
    },
    to: {
      name: 'Client Example Ltd',
      address: '2 Client Road\nClient Town',
      email: 'accounts@client.example',
      phone: '',
      taxId: '',
    },
    totals,
    layout: 'full',
    ...overrides,
  };
}

/** Extracts all text from a generated PDF so figures can be asserted. */
async function extractText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;

  let text = '';
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + ' ';
    page.cleanup();
  }

  await document.destroy();
  return text;
}

describe('invoice PDF', () => {
  it('produces a valid, readable PDF', async () => {
    const bytes = await buildDocumentPdf(buildInput());
    const loaded = await loadPdf(bytes);

    expect(loaded.pageCount).toBeGreaterThanOrEqual(1);
    // A4 portrait.
    expect(Math.round(loaded.pages[0]?.width ?? 0)).toBe(595);
    expect(Math.round(loaded.pages[0]?.height ?? 0)).toBe(842);
  });

  /**
   * Output parity (spec §12): the totals printed into the PDF must equal the
   * totals shown on screen. This is the check that makes the "figures on screen
   * match the figures in the PDF to the last cent" claim real.
   */
  it('prints exactly the totals the interface displays', async () => {
    const input = buildInput();
    const text = await extractText(await buildDocumentPdf(input));

    for (const value of [
      input.totals.subtotal,
      input.totals.discount,
      input.totals.taxableAmount,
      input.totals.tax,
      input.totals.total,
    ]) {
      const printed = moneyToFixed(value, 'USD');
      expect(text, `expected ${printed} in the PDF`).toContain(printed);
    }

    // The published worked example, end to end.
    expect(text).toContain('1950.00');
    expect(text).toContain('195.00');
    expect(text).toContain('1755.00');
    expect(text).toContain('351.00');
    expect(text).toContain('2106.00');
  });

  it('shows the taxable amount, so the order tax was applied in is visible', async () => {
    const text = await extractText(await buildDocumentPdf(buildInput()));
    expect(text).toContain('Taxable amount');
  });

  it('includes the document type, number and both parties', async () => {
    const text = await extractText(await buildDocumentPdf(buildInput()));

    expect(text).toContain('INVOICE');
    expect(text).toContain('INV-001');
    expect(text).toContain('Studio Example');
    expect(text).toContain('Client Example Ltd');
    expect(text).toContain('Thank you for your business.');
    expect(text).toContain('Payment due within 30 days.');
  });

  it('shows a balance due when partly paid', async () => {
    const totals = roundTotals(
      calculateTotals({
        lineItems: [line('Work', '1', '500')],
        currency: 'USD',
        discountKind: 'percent',
        discountValue: '',
        taxKind: 'percent',
        taxValue: '',
        feeValue: '',
        paidValue: '200',
      }),
      'USD',
    );

    const text = await extractText(await buildDocumentPdf(buildInput({ totals })));
    expect(text).toContain('Balance due');
    expect(text).toContain('300.00');
  });

  it('does not leak a source title into the metadata', async () => {
    const bytes = await buildDocumentPdf(buildInput());
    const document = await PDFDocument.load(bytes, { updateMetadata: false });

    expect(document.getProducer()).toBe('ToolNimbly');
    expect(document.getTitle()).toBe('Invoice INV-001');
  });

  it('adds pages rather than clipping a long document', async () => {
    const manyLines = Array.from({ length: 60 }, (_, index) =>
      line(`Line item number ${index + 1} with a fairly long description`, '2', '49.99'),
    );

    const totals = roundTotals(
      calculateTotals({
        lineItems: manyLines,
        currency: 'USD',
        discountKind: 'percent',
        discountValue: '',
        taxKind: 'percent',
        taxValue: '20',
        feeValue: '',
        paidValue: '',
      }),
      'USD',
    );

    const bytes = await buildDocumentPdf(buildInput({ totals }));
    const loaded = await loadPdf(bytes);

    expect(loaded.pageCount).toBeGreaterThan(1);

    // The totals still appear, on whichever page they ended up.
    const text = await extractText(bytes);
    expect(text).toContain(moneyToFixed(totals.total, 'USD'));
  });

  it('wraps long text instead of overflowing the page', async () => {
    const input = buildInput({
      from: {
        name: 'A Very Long Business Name That Would Certainly Overflow A Narrow Column',
        address:
          'A deliberately long address line that keeps going and going to force wrapping behaviour',
        email: 'an.extremely.long.email.address.for.testing@a-very-long-domain.example.com',
        phone: '+1 555 0100',
        taxId: 'TAX-0000000000000000',
      },
    });

    const bytes = await buildDocumentPdf(input);
    const loaded = await loadPdf(bytes);
    expect(loaded.pageCount).toBeGreaterThanOrEqual(1);

    const text = await extractText(bytes);
    // The name survives, even though it was wrapped across lines.
    expect(text.replace(/\s+/g, ' ')).toContain('A Very Long Business Name');
  });
});

describe('receipt PDF', () => {
  function receiptInput(layout: 'full' | 'compact') {
    const totals = roundTotals(
      calculateTotals({
        lineItems: [
          line('Flat white', '2', '3.80'),
          line('Sandwich', '1', '8.50'),
          line('Pastry', '2', '3.20'),
        ],
        currency: 'USD',
        discountKind: 'percent',
        discountValue: '',
        taxKind: 'percent',
        taxValue: '8',
        tipKind: 'percent',
        tipValue: '15',
        feeValue: '',
        paidValue: '30.00',
      }),
      'USD',
    );

    return buildInput({
      meta: {
        kind: 'receipt',
        number: 'R-1042',
        issueDate: '2026-09-18',
        paymentMethod: 'Cash',
        currency: 'USD',
        notes: '',
        terms: 'Returns accepted within 14 days with this receipt.',
        logo: null,
      },
      totals,
      layout,
    });
  }

  it('prints the published worked example exactly', async () => {
    const input = receiptInput('full');
    const text = await extractText(await buildDocumentPdf(input));

    expect(text).toContain('RECEIPT');
    expect(text).toContain('22.50'); // subtotal
    expect(text).toContain('1.80'); // 8% tax
    expect(text).toContain('3.38'); // 15% tip on the pre-tax subtotal
    expect(text).toContain('27.68'); // total
    expect(text).toContain('30.00'); // tendered
    expect(text).toContain('2.32'); // change, reconciled against the printed total
  });

  it('uses a narrow page for the compact layout', async () => {
    const bytes = await buildDocumentPdf(receiptInput('compact'));
    const loaded = await loadPdf(bytes);

    // 80 mm till roll.
    expect(Math.round(loaded.pages[0]?.width ?? 0)).toBe(227);
  });

  it('prints the same figures in both layouts', async () => {
    const full = await extractText(await buildDocumentPdf(receiptInput('full')));
    const compact = await extractText(await buildDocumentPdf(receiptInput('compact')));

    for (const figure of ['22.50', '1.80', '3.38', '27.68', '2.32']) {
      expect(full, `full layout missing ${figure}`).toContain(figure);
      expect(compact, `compact layout missing ${figure}`).toContain(figure);
    }
  });

  it('labels itself a receipt, never an invoice', async () => {
    const text = await extractText(await buildDocumentPdf(receiptInput('full')));
    expect(text).toContain('RECEIPT');
    expect(text).not.toContain('INVOICE');
  });
});

describe('currency handling in output', () => {
  it('prints whole units for a zero-decimal currency', async () => {
    const totals = roundTotals(
      calculateTotals({
        lineItems: [line('Item', '1', '1234.56')],
        currency: 'JPY',
        discountKind: 'percent',
        discountValue: '',
        taxKind: 'percent',
        taxValue: '',
        feeValue: '',
        paidValue: '',
      }),
      'JPY',
    );

    const input = buildInput({ totals });
    input.meta.currency = 'JPY';

    const text = await extractText(await buildDocumentPdf(input));
    expect(text).toContain('1235');
    expect(text).not.toContain('1234.56');
  });

  it('agrees with what the interface would format', async () => {
    const input = buildInput();
    // The screen shows a localised string; the PDF shows the plain figure.
    // Both must derive from the same rounded value.
    const displayed = formatMoney(input.totals.total, 'USD', 'en-US');
    const printed = moneyToFixed(input.totals.total, 'USD');

    expect(displayed).toContain('2,106.00');
    expect(printed).toBe('2106.00');
  });
});
