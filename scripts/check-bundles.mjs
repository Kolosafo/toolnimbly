/**
 * Verifies that heavy libraries stay in route-scoped chunks (spec §10.7).
 *
 * The risk is a shared chunk quietly absorbing pdf.js, pdf-lib or the QR
 * encoder, so every page — including a calculator — pays to download a PDF
 * parser. This reads the build manifests to find the chunks loaded on *every*
 * page, then fails if any of them contains a signature from a heavy library.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = process.cwd();
const manifestPath = join(root, '.next/build-manifest.json');

if (!existsSync(manifestPath)) {
  console.error('No build-manifest.json — run `pnpm build` first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

/**
 * Turbopack lists the chunks loaded on every page as `rootMainFiles`, with the
 * polyfill bundle alongside. Together these are what every visitor downloads,
 * whichever page they landed on.
 */
const shared = new Set([
  ...(manifest.rootMainFiles ?? []),
  ...(manifest.polyfillFiles ?? []),
]);

if (shared.size === 0) {
  console.error('The build manifest lists no shared chunks.');
  process.exit(1);
}

/** Signatures that identify a library without matching ordinary code. */
const HEAVY = [
  { name: 'pdf.js', patterns: ['PDFDocumentProxy', 'getTextContent', 'pdfjs'] },
  { name: 'pdf-lib', patterns: ['PDFDocument.load', 'copyPages', 'embedStandardFont'] },
  { name: 'qrcode', patterns: ['errorCorrectionLevel', 'QRCode'] },
  { name: 'big.js', patterns: ['BigError', 'toExponential'] },
  { name: 'fflate', patterns: ['deflateSync', 'FlateError'] },
];

const failures = [];
let rawBytes = 0;
let transferBytes = 0;

for (const chunk of shared) {
  if (!chunk.endsWith('.js')) continue;
  const path = join(root, '.next', chunk);
  if (!existsSync(path)) continue;

  const bytes = readFileSync(path);
  rawBytes += bytes.length;
  // What a visitor actually downloads. The uncompressed figure is three times
  // larger and is not what anyone waits for.
  transferBytes += gzipSync(bytes).length;

  const source = bytes.toString('utf8');

  for (const library of HEAVY) {
    const hits = library.patterns.filter((pattern) => source.includes(pattern));
    // Two or more signatures means the library is genuinely bundled, rather
    // than a single word appearing by coincidence.
    if (hits.length >= 2) {
      failures.push(`${library.name} appears in the shared chunk ${chunk} (${hits.join(', ')})`);
    }
  }
}

const chunkCount = [...shared].filter((chunk) => chunk.endsWith('.js')).length;

console.log(`Shared chunks:     ${chunkCount}`);
console.log(`Uncompressed:      ${(rawBytes / 1024).toFixed(0)} KB`);
console.log(`Transferred (gzip): ${(transferBytes / 1024).toFixed(0)} KB\n`);

if (failures.length > 0) {
  console.error('Heavy libraries leaked into the shared bundle:');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

/**
 * Ceiling on the transferred size, so the shared bundle cannot grow unnoticed.
 * The current figure is essentially React and the Next.js runtime; the headroom
 * is there to catch a regression, not to license growth.
 */
const TRANSFER_LIMIT_KB = 200;
const transferKb = transferBytes / 1024;

if (transferKb > TRANSFER_LIMIT_KB) {
  console.error(
    `Shared JavaScript is ${transferKb.toFixed(0)} KB gzipped, over the ${TRANSFER_LIMIT_KB} KB ceiling.`,
  );
  process.exit(1);
}

console.log('No heavy library is in the shared bundle.');
console.log(`Within the ${TRANSFER_LIMIT_KB} KB transfer ceiling.`);
