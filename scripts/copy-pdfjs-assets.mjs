/**
 * Copies the pdf.js runtime assets into `public/` so they are served from our
 * own origin.
 *
 * pdf.js needs three things at runtime that are not part of the JS bundle:
 *
 * - the worker script, which does the parsing off the main thread;
 * - the standard 14 font files, without which any PDF relying on them renders
 *   with missing glyphs and logs "Ensure that the `standardFontDataUrl` API
 *   parameter is provided" (found during the Phase 0 proof-of-concept);
 * - the CMap files, needed for PDFs using CJK encodings.
 *
 * They are copied rather than loaded from a CDN because the Content Security
 * Policy allows no third-party origin, and because a tool that promises local
 * processing should not reach out to one.
 *
 * Runs automatically before dev and build via the `prebuild` script.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/package.json'));
const publicDir = join(process.cwd(), 'public', 'pdfjs');

const assets = [
  { from: join(pdfjsRoot, 'build', 'pdf.worker.min.mjs'), to: join(publicDir, 'pdf.worker.min.mjs') },
  { from: join(pdfjsRoot, 'standard_fonts'), to: join(publicDir, 'standard_fonts') },
  { from: join(pdfjsRoot, 'cmaps'), to: join(publicDir, 'cmaps') },
  { from: join(pdfjsRoot, 'wasm'), to: join(publicDir, 'wasm') },
];

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

for (const asset of assets) {
  if (!existsSync(asset.from)) {
    console.warn(`[pdfjs] missing expected asset: ${asset.from}`);
    continue;
  }
  cpSync(asset.from, asset.to, { recursive: true });
}

console.log(`[pdfjs] copied worker, standard fonts, CMaps and wasm into ${publicDir}`);
