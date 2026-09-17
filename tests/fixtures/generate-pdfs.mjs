/**
 * Generates the PDF fixtures used by the unit and end-to-end suites.
 *
 * Every file is synthetic and contains no personal data, per SECURITY.md.
 * Run with:
 *
 *   node tests/fixtures/generate-pdfs.mjs
 *
 * The output is committed so CI does not depend on regenerating it.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

const here = dirname(fileURLToPath(import.meta.url));
const outputDir = join(here, 'pdfs');
mkdirSync(outputDir, { recursive: true });

const A4 = [595.28, 841.89];
const LETTER = [612, 792];

const written = [];
const write = (name, bytes) => {
  writeFileSync(join(outputDir, name), bytes);
  written.push(`${name} (${bytes.length} bytes)`);
};

/**
 * Builds a document whose pages are visibly distinct and individually
 * identifiable, so a merge or split can be checked page by page rather than
 * only by count.
 */
async function buildDocument({ title, pages }) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const [index, spec] of pages.entries()) {
    const page = doc.addPage(spec.size ?? A4);
    if (spec.rotate) page.setRotation(degrees(spec.rotate));

    const { width, height } = page.getSize();

    // A large page label, so a rendered page can be identified from its pixels.
    page.drawText(spec.label ?? `${title} page ${index + 1}`, {
      x: 48,
      y: height - 96,
      size: 28,
      font,
      color: rgb(0.05, 0.05, 0.05),
    });

    page.drawText(`${Math.round(width)} x ${Math.round(height)} points`, {
      x: 48,
      y: height - 140,
      size: 12,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });

    // A filled band gives a rasterised page non-white pixels to verify against.
    page.drawRectangle({
      x: 48,
      y: height / 2 - 40,
      width: width - 96,
      height: 80,
      color: rgb(Math.min(0.9, 0.1 + index * 0.12), 0.45, 0.75),
    });
  }

  return doc.save();
}

// A plain three-page A4 document: the default case.
write(
  'three-page.pdf',
  await buildDocument({
    title: 'Three page',
    pages: [{ label: 'Alpha' }, { label: 'Bravo' }, { label: 'Charlie' }],
  }),
);

// Mixed page sizes and a rotated page, to prove merge and split preserve both.
write(
  'mixed-sizes.pdf',
  await buildDocument({
    title: 'Mixed sizes',
    pages: [
      { label: 'A4 portrait', size: A4 },
      { label: 'US Letter', size: LETTER },
      { label: 'A4 rotated', size: A4, rotate: 90 },
      { label: 'Letter rotated', size: LETTER, rotate: 270 },
    ],
  }),
);

// A longer document for range selection and per-page splitting.
write(
  'ten-page.pdf',
  await buildDocument({
    title: 'Ten page',
    pages: Array.from({ length: 10 }, (_, index) => ({ label: `Page ${index + 1}` })),
  }),
);

// A second document to merge with the first.
write(
  'two-page.pdf',
  await buildDocument({ title: 'Two page', pages: [{ label: 'Delta' }, { label: 'Echo' }] }),
);

// Single page, for the smallest possible input.
write('single-page.pdf', await buildDocument({ title: 'Single', pages: [{ label: 'Only page' }] }));

/**
 * A PDF carrying an /Encrypt entry in its trailer.
 *
 * Handcrafted because pdf-lib cannot write encrypted documents. It is enough to
 * exercise the detection path: every PDF tool must refuse this cleanly, and
 * none of them implements password removal.
 */
function buildEncryptedPdf() {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\n',
    // A standard security handler dictionary.
    '4 0 obj\n<< /Filter /Standard /V 1 /R 2 /O <0123456789ABCDEF0123456789ABCDEF> ' +
      '/U <FEDCBA9876543210FEDCBA9876543210> /P -44 >>\nendobj\n',
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }

  const xrefStart = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Encrypt 4 0 R ` +
    `/ID [<0123456789ABCDEF0123456789ABCDEF> <0123456789ABCDEF0123456789ABCDEF>] >>\n` +
    `startxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(body + xref + trailer, 'latin1');
}

write('encrypted.pdf', buildEncryptedPdf());

// Deliberately broken inputs: these must fail cleanly, never hang.
const threePage = await buildDocument({ title: 'Truncated', pages: [{ label: 'One' }] });
write('truncated.pdf', Buffer.from(threePage.subarray(0, Math.floor(threePage.length / 2))));
write(
  'not-a-pdf.txt',
  Buffer.from('This is plain text with a .txt extension, not a PDF.\n', 'utf8'),
);

console.log(`Wrote ${written.length} PDF fixtures to ${outputDir}:`);
for (const entry of written) console.log(`  ${entry}`);
