# ToolNimbly Test Report

**Test date:** 20 September 2026
**Scope:** All 30 tools, shared site behavior, production rendering, accessibility, privacy, security, responsive layout, and the SEO build brief.

## Executive summary

ToolNimbly is in strong overall condition. All 30 tools now pass their automated functional coverage. The stale-date hydration defect, the compound-interest `NaN%` edge case, and the repository lint problem found in the initial audit have been corrected and have regression coverage.

The SEO build brief is integrated at the application level. All 30 tool pages have distinct keyword ownership, metadata, schema, reusable long-form content, cluster links, and embeddable variants. External acceptance items—Google indexing, production Rich Results checks, GA4 receipt, and field Core Web Vitals—still require a deployment and the connected Google accounts.

## Verification results

| Check                                               | Result                                                                    |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Unit and component tests                            | 427/427 passed across 19 test files                                       |
| Chromium end-to-end tests                           | 170/170 covered across the full run and clean targeted reruns             |
| Previous Firefox, WebKit, and mobile Chromium audit | 418/420 passed initially; both timeouts passed on a clean serial retry    |
| Production routes                                   | All 30 tools, 30 embeds, five hubs, and 11 guides generated               |
| Production build                                    | Next.js 16 Turbopack build passed and generated 90 static pages           |
| TypeScript                                          | Passed                                                                    |
| Full repository lint                                | Passed                                                                    |
| Shared JavaScript transfer budget                   | Passed at 167 KB gzip, below the 200 KB ceiling                           |
| Accessibility                                       | Tested pages had no critical or serious Axe violations                    |
| Privacy                                             | No tested user input or file bytes left the device                        |
| Security                                            | CSP and security-header checks passed                                     |
| Responsive layout                                   | All routes passed the 320 px horizontal-overflow/control-visibility check |

The first sandboxed Turbopack attempt was blocked from binding an internal local port. The same production build passed outside that restriction. A later monolithic Playwright rerun encountered an orphaned managed server; the affected specs were rerun against an isolated, explicitly managed production server and passed.

## Previously found defects — resolved

### 1. Resolved: stale dates and React hydration errors

**Affected tools:**

- Age Calculator
- Invoice Generator
- Receipt Generator

The initial audit found that these tools calculated their initial date while the statically generated page was being built. When the page was opened on a later date, its server-rendered content no longer agreed with the browser, React emitted hydration error `#418`, and the displayed defaults remained stale.

#### Reproduction

1. Build the production application on 18 September 2026.
2. Open the production build on 19 September 2026.
3. Visit the Age Calculator, Invoice Generator, or Receipt Generator.
4. Observe that the default date remains 18 September and that each page emits one React hydration error.

During testing, the browser clock reported 19 September 2026, while the Age Calculator and document issue-date fields continued to show 18 September 2026.

#### Impact

- The Age Calculator can calculate against yesterday instead of today.
- New invoices and receipts can start with an incorrect issue date.
- React abandons normal hydration for the mismatched subtree, adding unnecessary client work and potentially masking future hydration problems.

#### Relevant code

- `components/tools/calculators/age-calculator.tsx:23`
- `components/tools/business/document-state.ts:58`

#### Resolution

The affected components now use deterministic server output and initialize the visitor's local date safely in the browser. The end-to-end suite includes cross-day and uncaught-page-error regressions; they passed in the final Chromium run.

### 2. Resolved: Compound Interest Calculator displayed `NaN%`

**Affected tool:** Compound Interest Calculator

The initial audit found that all-zero inputs produced a valid zero balance but calculated the interest share as `0 / 0`.

#### Reproduction

1. Open the Compound Interest Calculator.
2. Enter `0` for Starting amount.
3. Enter `0` for Annual rate.
4. Enter `0` for the regular contribution Amount.
5. Observe `Interest as a share of the balance: NaN%`.

#### Relevant code

- `components/tools/calculators/compound-interest-calculator.tsx:162`

#### Resolution

The UI now handles a zero ending balance without division, and a browser regression test confirms no calculator displays `NaN` or `Infinity` for zeroed input.

### 3. Resolved: full repository lint command failed

The initial audit found 43 `no-console` errors in root-level QA scripts while the application directories passed.

#### Resolution

The repository lint target is clean. `CI=true pnpm lint` completed with no errors on 20 September 2026.

## Per-tool status

### Calculators

| Tool                         | Status | Notes                                                                                 |
| ---------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Percentage Calculator        | Pass   | Calculation modes, precision, validation, copy, and reset passed                      |
| Loan Calculator              | Pass   | Reference values, extra payments, zero interest, validation, schedule, and CSV passed |
| Mortgage Calculator          | Pass   | Calculation engine and default production UI output passed                            |
| Compound Interest Calculator | Pass   | All-zero input now shows a deliberate non-applicable state; regression test passed    |
| Salary Calculator            | Pass   | Conversion engine and default production UI output passed                             |
| Age Calculator               | Pass   | Current-date initialization and cross-day hydration regression passed                 |
| Date Difference Calculator   | Pass   | Inclusive dates, business-day behavior, and DST-spanning counts passed                |
| BMI Calculator               | Pass   | Metric/reference calculation, healthy range, and age restrictions passed              |
| Calorie Calculator           | Pass   | Safety-floor warning, age restriction, and disclaimer passed                          |

### Text and developer tools

| Tool               | Status | Notes                                                                                |
| ------------------ | ------ | ------------------------------------------------------------------------------------ |
| QR Code Generator  | Pass   | Payload escaping, URL normalization, contrast warning, downloads, and privacy passed |
| Password Generator | Pass   | Randomness, options, entropy, hidden output, validation, and privacy passed          |
| UUID Generator     | Pass   | UUID v4 validity, formatting, batching, and download passed                          |
| Word Counter       | Pass   | Word, sentence, paragraph, timing, and keyword statistics passed                     |
| Character Counter  | Pass   | Visible characters, technical length, bytes, lines, and limit tracking passed        |
| Case Converter     | Pass   | All modes, preservation of original text, and Turkish casing passed                  |

### Image tools

| Tool             | Status | Notes                                                                                |
| ---------------- | ------ | ------------------------------------------------------------------------------------ |
| Image Compressor | Pass   | Batch processing, size reporting, ZIP, individual download, and privacy passed       |
| JPG Compressor   | Pass   | JPG validation, processing, and output behavior passed                               |
| PNG Compressor   | Pass   | Lossless/lossy behavior and honest size reporting passed                             |
| Image Resizer    | Pass   | Aspect lock, output size, no-enlarge option, distortion warning, and download passed |
| Image Cropper    | Pass   | Source-resolution export, crop bounds, keyboard use, and aspect presets passed       |
| JPG to PNG       | Pass   | Conversion, output type, orientation, and size explanation passed                    |
| PNG to JPG       | Pass   | Transparency handling, matte color, warning, and conversion passed                   |

### PDF tools

| Tool           | Status | Notes                                                                            |
| -------------- | ------ | -------------------------------------------------------------------------------- |
| Image to PDF   | Pass   | Multi-image assembly, ordering, page modes, warning, and download passed         |
| PDF to JPG     | Pass   | Page selection, rendering, padded names, ZIP, and disclosure passed              |
| JPG to PDF     | Pass   | JPG-only validation and PDF assembly behavior passed                             |
| PDF Compressor | Pass   | Safe/raster modes, size reporting, warnings, encrypted files, and privacy passed |
| PDF Merger     | Pass   | Merge, ordering, encrypted/corrupt input, validation, and page counts passed     |
| PDF Splitter   | Pass   | Ranges, per-page output, deletion, ZIP naming, and invalid input passed          |

### Business tools

| Tool              | Status | Notes                                                                       |
| ----------------- | ------ | --------------------------------------------------------------------------- |
| Invoice Generator | Pass   | Core calculations, PDF output, and current-date hydration regression passed |
| Receipt Generator | Pass   | Core calculations, PDF output, and current-date hydration regression passed |

## Test-suite follow-up

The suite remains unusually thorough around privacy, file validation, arithmetic reconciliation, accessibility, and explaining lossy operations. The follow-up work added or verified:

1. End-to-end failure on uncaught page errors and unexpected console errors.
2. Cross-day production-build coverage for date-dependent defaults.
3. Dedicated calculator UI paths alongside the calculation-engine unit coverage.
4. The Compound Interest all-zero regression case.
5. A clean full-repository lint target so `pnpm verify` remains dependable.

## SEO build integration findings

### What now passes in the repository

- The registry contains exactly 30 tools with unique slugs, titles, descriptions, and primary keywords. No duplicate target keyword was found.
- Every page has one keyword-led H1, a unique meta description, and a self-referencing canonical. The five priority routes use the exact title and description map in `TOOLNIMBLY-SEO-CODEX-TASK.md`.
- Every tool has 800–1,500 words of reviewed page content. The measured range is 810–1,091 words, including instructions, a worked example, explanatory context, limitations, four to six FAQs, and related links.
- All 30 pages emit one `WebApplication`, one visible-content `FAQPage`, and exactly one `BreadcrumbList` JSON-LD object whose labels match the visible breadcrumb.
- With the optional blog disabled, the sitemap contains 52 unique code-managed indexable routes: the homepage, five hubs, 30 tools, the guides index, 11 guides, and four supporting pages. Embed and social-image routes are deliberately excluded.
- `robots.txt` references the sitemap, allows framework assets and query variants to be rendered, and disallows only `/api/` in production.
- Five topical hubs and 11 long-form guides form the hub ⇄ tool ⇄ related tool ⇄ guide link structure. Internal-link integrity is tested.
- Every tool exposes an embed dialog and a dedicated `/embed/{slug}` page. The generated snippet contains a plain crawlable credit link outside the iframe. Cross-origin rendering, noindex metadata, canonicalization, theme handling, and scoped framing headers passed end-to-end tests.
- The privacy policy now discloses Cloudflare Web Analytics without weakening the local-processing promise. Optional app-level analytics remain consent-gated; tested user inputs and file contents never enter analytics or network requests.
- The shared JavaScript bundle remains below budget at 167 KB transferred gzip, and heavy PDF/image libraries are absent from the shared bundle.

### Priority-page SEO task completed

- Invoice, receipt, compound-interest, salary, and loan pages now have the required distinct titles, descriptions, H1s, hero copy, canonicals, and matching Open Graph/Twitter metadata.
- Each priority page uses a distinct 1200×630 framework-generated image at `/tools/{slug}/social-image`, with a page-specific title, differentiator, dimensions, and alt text.
- Compound-interest and loan methodology blocks cite the requested Investor.gov and CFPB references with ordinary HTTPS links and clear non-endorsement context. Salary assumptions identify 40 hours and 52 paid weeks as editable defaults.
- The salary form states beside the inputs that every result is gross pay before tax and deductions.
- Four original supporting guides were added for receipts, compound-interest contributions, salary conversion, and extra loan payments. Each is linked from its tool and included in the guide index and sitemap.
- Calculators and Business Tools hubs now include contextual descriptions and natural links for the five priority user jobs.
- Invoice and receipt PDF downloads, loan and compound-interest CSV downloads, salary keyboard conversion, loan extra-payment savings, and compound contribution timing all pass browser tests.

### External verification still required

- Search Console indexing status cannot be inferred from the code. Submit the deployed `www` sitemap and verify each page in the connected property.
- GA4 needs a real measurement ID and the documented production environment variables before Realtime or DebugView can be tested.
- Rich Results Test should be run against deployed URLs even though the JSON-LD builders and page output pass local tests.
- Field Core Web Vitals require production traffic. The successful build, lazy tool loading, and bundle-budget result are useful safeguards, but they do not prove the mobile LCP, INP, and CLS acceptance thresholds.
- The apex host currently redirects to `www`, so the deployed environment must keep `NEXT_PUBLIC_SITE_URL=https://www.toolnimbly.com` to avoid canonical and sitemap host drift.

The operational steps are recorded in `docs/seo-launch-checklist.md`. The discovery inventory, cluster map, and monthly Search Console rank tracker are in `outputs/toolnimbly-seo/seo-rank-tracker.xlsx`.
