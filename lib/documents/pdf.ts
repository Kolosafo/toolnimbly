/**
 * Invoice and receipt PDF generation (spec §6.29, §6.30).
 *
 * Every figure printed here comes from the same rounded totals the interface
 * displays, so the document, the print view and the PDF cannot disagree.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';

import type { CurrencyCode } from '@/lib/formatting/number';
import { applyOutputMetadata, DOCUMENT_OPTIONS } from '@/lib/pdf/document';

import { moneyToFixed, type Money } from './money';
import type { DocumentTotals } from './model';

export type DocumentParty = {
  name: string;
  address: string;
  email: string;
  phone: string;
  /** Tax or company registration number. */
  taxId: string;
};

export type DocumentMeta = {
  /** "INVOICE" or "RECEIPT" — the document type, stated plainly. */
  kind: 'invoice' | 'receipt';
  number: string;
  issueDate: string;
  /** Invoice only. */
  dueDate?: string;
  /** Receipt only. */
  paymentMethod?: string;
  currency: CurrencyCode;
  notes: string;
  terms: string;
  /** Downscaled client-side and embedded directly; never uploaded. */
  logo?: { data: Uint8Array; type: 'image/jpeg' | 'image/png' } | null;
};

export type BuildDocumentInput = {
  meta: DocumentMeta;
  from: DocumentParty;
  to: DocumentParty;
  totals: DocumentTotals;
  /** Compact receipt roll, or a full page. */
  layout: 'full' | 'compact';
};

const A4 = { width: 595.28, height: 841.89 };
/** 80 mm thermal roll width, the common till-receipt size. */
const RECEIPT_ROLL = { width: 226.77, height: 800 };

const INK = rgb(0.09, 0.1, 0.12);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.85, 0.86, 0.88);

type Fonts = { regular: PDFFont; bold: PDFFont };

export async function buildDocumentPdf(input: BuildDocumentInput): Promise<Uint8Array> {
  const document = await PDFDocument.create(DOCUMENT_OPTIONS);
  const fonts: Fonts = {
    regular: await document.embedFont(StandardFonts.Helvetica),
    bold: await document.embedFont(StandardFonts.HelveticaBold),
  };

  let logo: PDFImage | null = null;
  if (input.meta.logo) {
    try {
      logo =
        input.meta.logo.type === 'image/jpeg'
          ? await document.embedJpg(input.meta.logo.data)
          : await document.embedPng(input.meta.logo.data);
    } catch {
      // A logo that cannot be embedded is omitted rather than failing the
      // whole document — the figures matter more than the branding.
      logo = null;
    }
  }

  const size = input.layout === 'compact' ? RECEIPT_ROLL : A4;

  if (input.layout === 'compact') {
    drawCompact(document, input, fonts, logo, size);
  } else {
    drawFullPage(document, input, fonts, logo, size);
  }

  applyOutputMetadata(
    document,
    `${input.meta.kind === 'invoice' ? 'Invoice' : 'Receipt'} ${input.meta.number}`.trim(),
  );

  return document.save();
}

/** Wraps text to a width, so long addresses and notes never overflow. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    let current = '';
    for (const word of paragraph.split(/\s+/)) {
      const candidate = current === '' ? word : `${current} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current !== '') lines.push(current);

      // A single word longer than the line is broken by character.
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = '';
        for (const character of word) {
          if (font.widthOfTextAtSize(chunk + character, size) > maxWidth) {
            lines.push(chunk);
            chunk = character;
          } else {
            chunk += character;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }

    if (current !== '') lines.push(current);
  }

  return lines;
}

type Cursor = { page: PDFPage; y: number };

function drawFullPage(
  document: PDFDocument,
  input: BuildDocumentInput,
  fonts: Fonts,
  logo: PDFImage | null,
  size: { width: number; height: number },
): void {
  const margin = 48;
  const contentWidth = size.width - margin * 2;
  const money = (value: Money) => moneyToFixed(value, input.meta.currency);

  const cursor: Cursor = { page: document.addPage([size.width, size.height]), y: size.height - margin };

  /** Adds a page when the next block would not fit, so nothing is clipped. */
  const ensureSpace = (needed: number) => {
    if (cursor.y - needed >= margin) return;
    cursor.page = document.addPage([size.width, size.height]);
    cursor.y = size.height - margin;
  };

  const text = (
    value: string,
    options: { x?: number; size?: number; bold?: boolean; color?: typeof INK; align?: 'left' | 'right' } = {},
  ) => {
    const fontSize = options.size ?? 10;
    const font = options.bold ? fonts.bold : fonts.regular;
    const width = font.widthOfTextAtSize(value, fontSize);
    const x =
      options.align === 'right'
        ? size.width - margin - width
        : (options.x ?? margin);

    cursor.page.drawText(value, {
      x,
      y: cursor.y,
      size: fontSize,
      font,
      color: options.color ?? INK,
    });
  };

  // --- Header ---------------------------------------------------------------
  if (logo) {
    const maxWidth = 140;
    const maxHeight = 56;
    const scale = Math.min(maxWidth / logo.width, maxHeight / logo.height, 1);
    cursor.page.drawImage(logo, {
      x: margin,
      y: cursor.y - logo.height * scale + 12,
      width: logo.width * scale,
      height: logo.height * scale,
    });
  }

  text(input.meta.kind === 'invoice' ? 'INVOICE' : 'RECEIPT', {
    size: 24,
    bold: true,
    align: 'right',
  });
  cursor.y -= 22;

  if (input.meta.number) {
    text(`No. ${input.meta.number}`, { size: 10, color: MUTED, align: 'right' });
    cursor.y -= 14;
  }

  cursor.y -= logo ? 40 : 14;

  // --- Parties --------------------------------------------------------------
  const columnWidth = contentWidth / 2 - 12;
  const startY = cursor.y;

  const drawParty = (label: string, party: DocumentParty, x: number) => {
    let y = startY;
    cursor.page.drawText(label, { x, y, size: 8, font: fonts.bold, color: MUTED });
    y -= 14;

    const lines = [
      party.name,
      ...(party.address ? party.address.split('\n') : []),
      party.email,
      party.phone,
      party.taxId,
    ].filter((line) => line && line.trim() !== '');

    for (const line of lines) {
      for (const wrapped of wrapText(line, fonts.regular, 10, columnWidth)) {
        cursor.page.drawText(wrapped, { x, y, size: 10, font: fonts.regular, color: INK });
        y -= 13;
      }
    }

    return y;
  };

  const fromBottom = drawParty('FROM', input.from, margin);
  const toBottom = drawParty(
    input.meta.kind === 'invoice' ? 'BILL TO' : 'CUSTOMER',
    input.to,
    margin + columnWidth + 24,
  );

  cursor.y = Math.min(fromBottom, toBottom) - 14;

  // --- Dates ----------------------------------------------------------------
  const details: [string, string][] = [['Issued', input.meta.issueDate]];
  if (input.meta.dueDate) details.push(['Due', input.meta.dueDate]);
  if (input.meta.paymentMethod) details.push(['Payment method', input.meta.paymentMethod]);

  for (const [label, value] of details) {
    if (!value) continue;
    text(label, { size: 9, color: MUTED });
    text(value, { size: 10, align: 'right' });
    cursor.y -= 14;
  }

  cursor.y -= 10;

  // --- Line items -----------------------------------------------------------
  const columns = {
    description: margin,
    quantity: margin + contentWidth * 0.58,
    unitPrice: margin + contentWidth * 0.72,
    total: size.width - margin,
  };

  const drawTableHeader = () => {
    cursor.page.drawLine({
      start: { x: margin, y: cursor.y + 12 },
      end: { x: size.width - margin, y: cursor.y + 12 },
      thickness: 1,
      color: RULE,
    });

    cursor.page.drawText('DESCRIPTION', {
      x: columns.description,
      y: cursor.y,
      size: 8,
      font: fonts.bold,
      color: MUTED,
    });
    for (const [label, x] of [
      ['QTY', columns.quantity],
      ['UNIT', columns.unitPrice],
    ] as const) {
      cursor.page.drawText(label, { x, y: cursor.y, size: 8, font: fonts.bold, color: MUTED });
    }
    const totalWidth = fonts.bold.widthOfTextAtSize('AMOUNT', 8);
    cursor.page.drawText('AMOUNT', {
      x: columns.total - totalWidth,
      y: cursor.y,
      size: 8,
      font: fonts.bold,
      color: MUTED,
    });

    cursor.y -= 8;
    cursor.page.drawLine({
      start: { x: margin, y: cursor.y },
      end: { x: size.width - margin, y: cursor.y },
      thickness: 1,
      color: RULE,
    });
    cursor.y -= 16;
  };

  ensureSpace(80);
  drawTableHeader();

  for (const line of input.totals.lines) {
    const descriptionLines = wrapText(
      line.description || '—',
      fonts.regular,
      10,
      contentWidth * 0.55,
    );

    ensureSpace(descriptionLines.length * 13 + 10);

    const rowTop = cursor.y;

    for (const [index, wrapped] of descriptionLines.entries()) {
      cursor.page.drawText(wrapped, {
        x: columns.description,
        y: rowTop - index * 13,
        size: 10,
        font: fonts.regular,
        color: INK,
      });
    }

    const quantityText = line.quantity.toString();
    const unitText = money(line.unitPrice);
    const totalText = money(line.total);

    cursor.page.drawText(quantityText, {
      x: columns.quantity,
      y: rowTop,
      size: 10,
      font: fonts.regular,
      color: INK,
    });
    cursor.page.drawText(unitText, {
      x: columns.unitPrice,
      y: rowTop,
      size: 10,
      font: fonts.regular,
      color: INK,
    });
    cursor.page.drawText(totalText, {
      x: columns.total - fonts.regular.widthOfTextAtSize(totalText, 10),
      y: rowTop,
      size: 10,
      font: fonts.regular,
      color: INK,
    });

    cursor.y = rowTop - descriptionLines.length * 13 - 4;
  }

  cursor.y -= 8;
  cursor.page.drawLine({
    start: { x: margin, y: cursor.y },
    end: { x: size.width - margin, y: cursor.y },
    thickness: 1,
    color: RULE,
  });
  cursor.y -= 18;

  // --- Totals ---------------------------------------------------------------
  const totalsRows = buildTotalsRows(input, money);
  ensureSpace(totalsRows.length * 16 + 40);

  for (const row of totalsRows) {
    const labelWidth = (row.bold ? fonts.bold : fonts.regular).widthOfTextAtSize(row.label, 10);
    const valueWidth = (row.bold ? fonts.bold : fonts.regular).widthOfTextAtSize(row.value, 10);

    cursor.page.drawText(row.label, {
      x: size.width - margin - 180 - labelWidth + 180,
      y: cursor.y,
      size: 10,
      font: row.bold ? fonts.bold : fonts.regular,
      color: row.bold ? INK : MUTED,
    });
    cursor.page.drawText(row.value, {
      x: size.width - margin - valueWidth,
      y: cursor.y,
      size: 10,
      font: row.bold ? fonts.bold : fonts.regular,
      color: INK,
    });
    cursor.y -= 16;
  }

  // --- Notes, terms and the scope disclaimer --------------------------------
  cursor.y -= 12;

  for (const [label, body] of [
    ['Notes', input.meta.notes],
    ['Terms', input.meta.terms],
  ] as const) {
    if (!body.trim()) continue;

    const lines = wrapText(body, fonts.regular, 9, contentWidth);
    ensureSpace(lines.length * 12 + 24);

    text(label.toUpperCase(), { size: 8, bold: true, color: MUTED });
    cursor.y -= 13;

    for (const wrapped of lines) {
      cursor.page.drawText(wrapped, {
        x: margin,
        y: cursor.y,
        size: 9,
        font: fonts.regular,
        color: INK,
      });
      cursor.y -= 12;
    }
    cursor.y -= 8;
  }
}

function buildTotalsRows(
  input: BuildDocumentInput,
  money: (value: Money) => string,
): { label: string; value: string; bold?: boolean }[] {
  const { totals, meta } = input;
  const rows: { label: string; value: string; bold?: boolean }[] = [
    { label: 'Subtotal', value: money(totals.subtotal) },
  ];

  if (!totals.discount.eq(0)) {
    rows.push({ label: 'Discount', value: `-${money(totals.discount)}` });
    // Shown explicitly so the order tax was applied in is visible, not implied.
    rows.push({ label: 'Taxable amount', value: money(totals.taxableAmount) });
  }

  if (!totals.tax.eq(0)) rows.push({ label: 'Tax', value: money(totals.tax) });
  if (!totals.tip.eq(0)) rows.push({ label: 'Tip', value: money(totals.tip) });
  if (!totals.fee.eq(0)) rows.push({ label: 'Fee', value: money(totals.fee) });

  rows.push({ label: 'Total', value: money(totals.total), bold: true });

  if (!totals.paid.eq(0)) {
    rows.push({
      label: meta.kind === 'receipt' ? 'Amount tendered' : 'Paid',
      value: money(totals.paid),
    });
  }

  if (meta.kind === 'receipt') {
    if (!totals.change.eq(0)) {
      rows.push({ label: 'Change', value: money(totals.change), bold: true });
    }
  } else if (!totals.balanceDue.eq(totals.total) || !totals.paid.eq(0)) {
    rows.push({ label: 'Balance due', value: money(totals.balanceDue), bold: true });
  }

  return rows;
}

/** A narrow till-roll layout for receipts. */
function drawCompact(
  document: PDFDocument,
  input: BuildDocumentInput,
  fonts: Fonts,
  logo: PDFImage | null,
  size: { width: number; height: number },
): void {
  const margin = 16;
  const contentWidth = size.width - margin * 2;
  const money = (value: Money) => moneyToFixed(value, input.meta.currency);

  const page = document.addPage([size.width, size.height]);
  let y = size.height - margin;

  const centred = (value: string, fontSize: number, bold = false) => {
    const font = bold ? fonts.bold : fonts.regular;
    const width = font.widthOfTextAtSize(value, fontSize);
    page.drawText(value, {
      x: (size.width - width) / 2,
      y,
      size: fontSize,
      font,
      color: INK,
    });
    y -= fontSize + 4;
  };

  const row = (label: string, value: string, bold = false) => {
    const font = bold ? fonts.bold : fonts.regular;
    page.drawText(label, { x: margin, y, size: 8, font, color: INK });
    const width = font.widthOfTextAtSize(value, 8);
    page.drawText(value, { x: size.width - margin - width, y, size: 8, font, color: INK });
    y -= 12;
  };

  if (logo) {
    const scale = Math.min(80 / logo.width, 40 / logo.height, 1);
    page.drawImage(logo, {
      x: (size.width - logo.width * scale) / 2,
      y: y - logo.height * scale,
      width: logo.width * scale,
      height: logo.height * scale,
    });
    y -= logo.height * scale + 10;
  }

  if (input.from.name) centred(input.from.name, 11, true);
  for (const line of input.from.address.split('\n').filter(Boolean)) {
    centred(line, 7);
  }
  if (input.from.phone) centred(input.from.phone, 7);

  y -= 6;
  centred('RECEIPT', 10, true);
  if (input.meta.number) centred(`No. ${input.meta.number}`, 7);
  if (input.meta.issueDate) centred(input.meta.issueDate, 7);

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: size.width - margin, y },
    thickness: 0.5,
    color: RULE,
  });
  y -= 12;

  for (const line of input.totals.lines) {
    const descriptionLines = wrapText(line.description || '—', fonts.regular, 8, contentWidth);
    for (const wrapped of descriptionLines) {
      page.drawText(wrapped, { x: margin, y, size: 8, font: fonts.regular, color: INK });
      y -= 10;
    }
    row(`  ${line.quantity.toString()} × ${money(line.unitPrice)}`, money(line.total));
  }

  y -= 4;
  page.drawLine({
    start: { x: margin, y },
    end: { x: size.width - margin, y },
    thickness: 0.5,
    color: RULE,
  });
  y -= 12;

  for (const entry of buildTotalsRows(input, money)) {
    row(entry.label, entry.value, entry.bold ?? false);
  }

  if (input.meta.paymentMethod) {
    y -= 4;
    row('Paid by', input.meta.paymentMethod);
  }

  y -= 10;
  for (const body of [input.meta.notes, input.meta.terms]) {
    if (!body.trim()) continue;
    for (const wrapped of wrapText(body, fonts.regular, 7, contentWidth)) {
      centred(wrapped, 7);
    }
    y -= 4;
  }
}
