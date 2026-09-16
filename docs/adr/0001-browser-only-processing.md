# ADR 0001 — All tool processing happens in the browser

**Status:** accepted · **Date:** 2026-09-16

## Context

The product handles images, PDFs and business documents. These routinely contain
bank statements, medical letters, identity documents, client details and Wi-Fi
passwords. A conventional architecture uploads the file, processes it on a
server and returns a result.

## Decision

No tool sends user content to a server. Decoding, transformation, encoding, PDF
parsing and document assembly all run in the browser using standard web APIs
plus client-side libraries (`pdf-lib`, `pdfjs-dist`, `fflate`, `qrcode`). The
application ships **no file upload endpoint at all**.

## Consequences

**Positive**

- The privacy claim is structural rather than a policy promise. There is no
  server-side copy to leak, retain, subpoena or mishandle.
- No upload wait, no queue, no per-file cost. The tools stay free to run.
- The claim is user-verifiable: the browser network panel shows no request
  carrying file content. This is asserted automatically by the privacy
  regression test (spec §10.8).

**Negative / accepted limits**

- Processing is bounded by the user's device. Limits are centralised in
  `lib/config/limits.ts` — 20 MB and 40 megapixels per image, 100 MB and 500
  pages per PDF — and are quoted verbatim in error messages.
- Some operations are simply unavailable: OCR, aggressive PDF image
  recompression, and HEIC decoding where the browser lacks native support. These
  are documented on the affected tool pages rather than silently degraded.
- Output can differ slightly between browsers, because JPEG/PNG/WebP encoders
  differ. Tests assert format validity and dimensions rather than byte equality.

## Alternatives rejected

- **Server-side processing**: better capability, but it destroys the core
  product promise and creates an ongoing custodial obligation over sensitive
  documents.
- **Hybrid with opt-in upload**: rejected for v1. An upload path that exists at
  all weakens the verifiable claim and invites accidental use.
