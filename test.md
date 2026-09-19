# ToolNimbly Test Report

**Test date:** 19 September 2026  
**Scope:** All 30 tools, shared site behavior, production rendering, accessibility, privacy, security, responsive layout, and cross-browser behavior.

## Executive summary

ToolNimbly is in strong overall condition. Twenty-six tools passed without a product defect. Two distinct functional issues affect four tools:

1. The Age Calculator, Invoice Generator, and Receipt Generator use a stale build-time date and emit React hydration errors after the calendar date changes.
2. The Compound Interest Calculator displays `NaN%` when the ending balance is zero.

A separate repository tooling issue causes the full lint command to fail on root-level `.qa*.mjs` scripts. The application source itself passes lint.

## Verification results

| Check | Result |
| --- | --- |
| Unit tests | 407/407 passed across 16 test files |
| Chromium end-to-end tests | 140/140 passed |
| Firefox, WebKit, and mobile Chromium | 418/420 passed initially; both timeouts passed on a clean serial retry |
| Production routes | All 30 tool routes returned HTTP 200 |
| Production build | Webpack production build passed and generated all 46 pages |
| TypeScript | Passed |
| Application-source lint | Passed |
| Full repository lint | Failed with 43 errors in root `.qa*.mjs` scripts |
| Accessibility | Tested pages had no critical or serious Axe violations |
| Privacy | No tested user input or file bytes left the device |
| Security | CSP and security-header checks passed |
| Responsive layout | All routes passed the 320 px horizontal-overflow/control-visibility check |

The default Turbopack build could not be executed in the restricted test environment because its CSS worker was prevented from binding an internal local port. The webpack production build completed successfully, so this was treated as an environment restriction rather than an application defect.

## Findings

### 1. High priority: stale dates and React hydration errors

**Affected tools:**

- Age Calculator
- Invoice Generator
- Receipt Generator

These tools calculate their initial date while the statically generated page is being built. When the page is opened on a later date, its server-rendered content no longer agrees with the browser. React emits minified hydration error `#418`, and the displayed defaults remain stale.

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

#### Recommendation

Use a deterministic server-rendered initial value, then initialize the user's current local date after the component mounts. Do not merely suppress the hydration warning, because that would leave the stale-date behavior intact.

Add an end-to-end regression test that builds on one date, runs the browser on another date, and fails on any uncaught `pageerror`.

### 2. Low priority: Compound Interest Calculator displays `NaN%`

**Affected tool:** Compound Interest Calculator

When starting amount, annual rate, and regular contribution are all zero, the calculator returns a valid zero balance but calculates the interest share as `0 / 0`.

#### Reproduction

1. Open the Compound Interest Calculator.
2. Enter `0` for Starting amount.
3. Enter `0` for Annual rate.
4. Enter `0` for the regular contribution Amount.
5. Observe `Interest as a share of the balance: NaN%`.

#### Relevant code

- `components/tools/calculators/compound-interest-calculator.tsx:162`

#### Recommendation

Guard against an ending balance of zero. Display `Not applicable`, `—`, or a deliberately chosen `0.0%` rather than performing the division.

Add a UI regression test for the all-zero case.

### 3. Repository tooling: full lint command fails

`pnpm lint` reports 43 `no-console` errors from root-level QA scripts, including tracked and untracked `.qa*.mjs` files. Running ESLint over the application directories passes.

#### Recommendation

Choose one of the following:

- Move the scripts into an explicitly configured QA directory and give that directory appropriate lint rules.
- Exclude disposable QA scripts from the production lint target.
- Replace or locally permit their intentional console output.

## Per-tool status

### Calculators

| Tool | Status | Notes |
| --- | --- | --- |
| Percentage Calculator | Pass | Calculation modes, precision, validation, copy, and reset passed |
| Loan Calculator | Pass | Reference values, extra payments, zero interest, validation, schedule, and CSV passed |
| Mortgage Calculator | Pass | Calculation engine and default production UI output passed |
| Compound Interest Calculator | Issue | All-zero input displays `NaN%` |
| Salary Calculator | Pass | Conversion engine and default production UI output passed |
| Age Calculator | Issue | Stale current date and hydration error |
| Date Difference Calculator | Pass | Inclusive dates, business-day behavior, and DST-spanning counts passed |
| BMI Calculator | Pass | Metric/reference calculation, healthy range, and age restrictions passed |
| Calorie Calculator | Pass | Safety-floor warning, age restriction, and disclaimer passed |

### Text and developer tools

| Tool | Status | Notes |
| --- | --- | --- |
| QR Code Generator | Pass | Payload escaping, URL normalization, contrast warning, downloads, and privacy passed |
| Password Generator | Pass | Randomness, options, entropy, hidden output, validation, and privacy passed |
| UUID Generator | Pass | UUID v4 validity, formatting, batching, and download passed |
| Word Counter | Pass | Word, sentence, paragraph, timing, and keyword statistics passed |
| Character Counter | Pass | Visible characters, technical length, bytes, lines, and limit tracking passed |
| Case Converter | Pass | All modes, preservation of original text, and Turkish casing passed |

### Image tools

| Tool | Status | Notes |
| --- | --- | --- |
| Image Compressor | Pass | Batch processing, size reporting, ZIP, individual download, and privacy passed |
| JPG Compressor | Pass | JPG validation, processing, and output behavior passed |
| PNG Compressor | Pass | Lossless/lossy behavior and honest size reporting passed |
| Image Resizer | Pass | Aspect lock, output size, no-enlarge option, distortion warning, and download passed |
| Image Cropper | Pass | Source-resolution export, crop bounds, keyboard use, and aspect presets passed |
| JPG to PNG | Pass | Conversion, output type, orientation, and size explanation passed |
| PNG to JPG | Pass | Transparency handling, matte color, warning, and conversion passed |

### PDF tools

| Tool | Status | Notes |
| --- | --- | --- |
| Image to PDF | Pass | Multi-image assembly, ordering, page modes, warning, and download passed |
| PDF to JPG | Pass | Page selection, rendering, padded names, ZIP, and disclosure passed |
| JPG to PDF | Pass | JPG-only validation and PDF assembly behavior passed |
| PDF Compressor | Pass | Safe/raster modes, size reporting, warnings, encrypted files, and privacy passed |
| PDF Merger | Pass | Merge, ordering, encrypted/corrupt input, validation, and page counts passed |
| PDF Splitter | Pass | Ranges, per-page output, deletion, ZIP naming, and invalid input passed |

### Business tools

| Tool | Status | Notes |
| --- | --- | --- |
| Invoice Generator | Issue | Core calculations and PDF passed; default issue date becomes stale and hydrates incorrectly |
| Receipt Generator | Issue | Core calculations and PDF passed; default issue date becomes stale and hydrates incorrectly |

## Test-suite feedback

The existing suite is unusually thorough, especially around privacy, file validation, arithmetic reconciliation, accessibility, and explaining lossy operations to users. Recommended additions:

1. Fail end-to-end tests on uncaught page errors and unexpected console errors.
2. Add a cross-day production-build test for date-dependent defaults.
3. Add dedicated UI scenarios for Mortgage, Compound Interest, and Salary; their calculation engines have strong unit coverage, but their UI paths have less targeted coverage.
4. Add the Compound Interest all-zero regression case.
5. Clarify lint handling for root QA scripts so `pnpm verify` remains dependable.
