# ADR 0002 — A typed registry drives routing, metadata and navigation

**Status:** accepted · **Date:** 2026-09-16

## Context

Thirty tools each need a canonical route, unique metadata, a sitemap entry,
navigation placement, related links and editorial content. Duplicating that per
page guarantees drift.

## Decision

A single typed registry (`lib/registry/tools.ts`) is the source of truth. One
dynamic route, `app/tools/[slug]/page.tsx`, prerenders all 30 pages via
`generateStaticParams()` with `dynamicParams = false`. `generateMetadata()`
derives metadata from the same entries. The sitemap, navigation, footer, search
index and related links are all projections of the registry.

Invariants live in `lib/registry/validate.ts` and are enforced in two places:
the unit suite, and `app/sitemap.ts` — which runs during `next build`, so a
broken registry fails the build.

## Consequences

- Adding a tool is three mechanical changes: a registry entry, a content module
  and a line in the lazy component map. Anything missing fails validation.
- Orphan routes and broken related links are impossible to ship: validation
  rejects a related slug that does not resolve, and a content module with no
  registry entry.
- `dynamicParams = false` means an unknown slug returns a true 404 status
  rather than rendering on demand.
- Registry entries are compile-time constants, so the search index is built
  without a runtime fetch and ships as a few kilobytes.

## Alternatives rejected

- **One file per route**: 30 near-identical page files, with metadata and
  breadcrumb logic copy-pasted. Rejected as unmaintainable.
- **CMS-driven content**: out of scope for v1 and adds a network dependency to
  pages that must render instantly.
