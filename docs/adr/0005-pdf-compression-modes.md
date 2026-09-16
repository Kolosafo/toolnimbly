# ADR 0005 — PDF compression offers two honest modes, not one magic one

**Status:** accepted · **Date:** 2026-09-16

## Context

"Compress PDF" tools commonly advertise large reductions without saying what
they discard. In a browser, only two things are actually achievable:

1. rewriting the document structure — safe, but usually saves very little,
   because most of a PDF's bytes are embedded images and fonts that
   `pdf-lib` cannot recompress;
2. rasterising pages to images and rebuilding the document — large savings, but
   it destroys selectable text, links, bookmarks, form fields, annotations and
   accessibility tagging.

## Decision

Both modes are offered and named for what they do. **Optimise structure** is the
default. **Rasterise pages** is opt-in and carries an explicit warning about
what is lost *before* the user proceeds.

The tool compares input and output byte counts and reports the real change. If
the output is larger — which happens when rasterising a text-based PDF — it says
so and recommends the original. Success is never declared merely because the
process completed. Outputs are re-parsed and a representative page re-rendered
before the result is offered.

## Consequences

- Users occasionally see "this saved 2%", which is the truthful answer for a PDF
  that was already efficient.
- The middle option — recompressing embedded images inside an otherwise intact
  PDF — is not available in v1 and is documented as a known limitation.
- Encrypted PDFs are detected and refused across every PDF tool. No
  password-circumvention capability is implemented anywhere in the product.
