# Next.js Utility Website — Product and Engineering Specification

> Build brief for Codex or Claude Code  
> Working product name: **ToolNest** (replaceable through configuration)  
> Scope: **30 production-ready browser utilities**  
> Document status: implementation specification  
> Last updated: 2026-09-16

---

## 1. Instructions to the coding agent

Build the application described in this document as a production-quality Next.js project. Treat every item marked **MUST** as required for launch, every **SHOULD** item as a default unless it conflicts with a MUST, and every **MAY** item as optional.

The implementation must favor working tools, correctness, privacy, accessibility, fast page loads, and useful original page content. Do not create placeholder tools, fake progress, nonfunctional download buttons, keyword-variant doorway pages, or generated filler copy. When a specification is ambiguous, choose the smallest correct and testable behavior, document the choice, and continue.

Implementation rules:

1. Use the current stable Next.js App Router release and a currently supported Node.js LTS release at implementation time. Record exact versions in the lockfile and `package.json` engines.
2. Use TypeScript in strict mode and `pnpm` unless the repository already uses another package manager.
3. Keep normal tool processing in the browser. Do not upload a user's document, image, invoice, receipt, password settings, or text to a server.
4. Give each of the 30 tools its own crawlable, canonical route with real server-rendered explanatory content.
5. Build the shared shell and primitives once. Do not duplicate layouts or SEO logic across 30 pages.
6. Add tests with each implementation phase. A tool is not complete merely because its interface renders.
7. Never silently weaken a required feature because a library makes it difficult. Surface the gap in the project README and leave the affected phase incomplete.
8. Do not add authentication, accounts, a database, payments, international tax calculation, AI features, or a CMS in v1.
9. Do not add ads until the ad-readiness acceptance criteria in this document are satisfied. Reserve placements without causing layout shift.
10. Keep the product deployable on Vercel. Avoid provider-specific dependencies in core tool logic.

### Definition of “done”

The project is done only when all 30 routes implement their stated behaviors, production build and checks pass, critical user journeys pass in Chromium/WebKit/Firefox, downloadable artifacts are valid, pages are keyboard-usable, metadata is unique, and the deployment checklist is documented.

---

## 2. Product vision

ToolNest is a fast, privacy-respecting website for everyday calculations, text manipulation, image processing, PDF operations, and small-business document generation. Users should be able to arrive from search, understand the tool immediately, complete the task without an account, and download or copy the result.

The site competes on:

- immediate utility: the interactive tool appears near the top of the page;
- honest behavior: no fake controls or hidden upload flow;
- local-first privacy: file and text processing stays on the device;
- speed: useful HTML arrives before heavy tool code;
- clarity: defaults, units, validation, formulas, and limitations are explicit;
- accessibility: complete keyboard and screen-reader operation;
- depth: each route contains genuinely useful instructions, examples, FAQs, and relevant related tools;
- maintainability: a registry drives navigation, metadata, sitemaps, related tools, and static route generation.

### Goals

- Ship exactly the 30 tools listed in §6.
- Make every tool useful on a modern phone and desktop browser.
- Generate one stable, indexable URL per distinct tool/search intent.
- Avoid server-side handling of private user files.
- Make new tools easy to add without changing the site shell.
- Support later monetization without harming the primary workflow or Core Web Vitals.

### Non-goals for v1

- User accounts, cloud history, team collaboration, or document sharing.
- OCR, scanned-PDF editing, PDF-to-Word, e-signatures, or password-protected PDF unlocking.
- Jurisdiction-specific payroll/tax estimates.
- Medical diagnosis or prescriptive health advice.
- Batch processing beyond limits explicitly stated for a tool.
- Native mobile apps or browser extensions.
- Multiple near-duplicate landing pages for keyword variants such as “free,” “online,” or a particular target file size.
- Guaranteed pixel-identical PDF rendering across every PDF feature in the standard.

---

## 3. Success metrics

Instrument only anonymous, consent-respecting events. Never send entered values, text content, filenames, document content, generated passwords, invoice customer data, or file bytes.

### Product metrics

- Tool completion rate: `tool_success / tool_started`.
- Error rate by tool and broad error code.
- Download/copy rate after successful output.
- Related-tool navigation rate.
- Repeat visits, measured only through privacy-compatible analytics if enabled.
- Search impressions, indexed pages, click-through rate, and query coverage in Search Console.

### Quality targets

- 100% of launch routes have unique title, description, canonical, H1, introductory copy, instructions, limitations, FAQs, and related-tool links.
- Zero critical or serious automated accessibility violations on representative pages.
- Zero known incorrect reference calculations in the test suite.
- Zero network requests containing user-provided tool payloads.
- No horizontal page overflow at 320 CSS pixels.
- Target p75 field Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- Initial page content remains functional when analytics and ad scripts fail.

---

## 4. Information architecture and routes

### Primary routes

| Route | Purpose |
|---|---|
| `/` | Homepage with search, category cards, popular tools, privacy promise, and recently added tools |
| `/calculators` | Calculator category page |
| `/text-developer-tools` | Text and developer category page |
| `/image-tools` | Image category page |
| `/pdf-tools` | PDF category page |
| `/business-tools` | Business document category page |
| `/tools/[slug]` | Canonical route for an individual tool |
| `/about` | Editorial purpose, methodology, and ownership |
| `/privacy` | Privacy policy, including local processing and analytics disclosure |
| `/terms` | Terms, warranties, prohibited use, medical/financial disclaimers |
| `/contact` | Accessible contact method; may be a mail link in v1 |
| `/404` | Helpful not-found state with search and popular tools |
| `/sitemap.xml` | Generated from the route registry |
| `/robots.txt` | Production crawl policy and sitemap location |

### Tool routes

| # | Category | Tool | Canonical route |
|---:|---|---|---|
| 1 | Calculators | Percentage Calculator | `/tools/percentage-calculator` |
| 2 | Calculators | Loan Calculator | `/tools/loan-calculator` |
| 3 | Calculators | Mortgage Calculator | `/tools/mortgage-calculator` |
| 4 | Calculators | Compound Interest Calculator | `/tools/compound-interest-calculator` |
| 5 | Calculators | Salary Calculator | `/tools/salary-calculator` |
| 6 | Calculators | Age Calculator | `/tools/age-calculator` |
| 7 | Calculators | Date Difference Calculator | `/tools/date-difference-calculator` |
| 8 | Calculators | BMI Calculator | `/tools/bmi-calculator` |
| 9 | Calculators | Calorie Calculator | `/tools/calorie-calculator` |
| 10 | Text & Developer | QR Code Generator | `/tools/qr-code-generator` |
| 11 | Text & Developer | Password Generator | `/tools/password-generator` |
| 12 | Text & Developer | UUID Generator | `/tools/uuid-generator` |
| 13 | Text & Developer | Word Counter | `/tools/word-counter` |
| 14 | Text & Developer | Character Counter | `/tools/character-counter` |
| 15 | Text & Developer | Case Converter | `/tools/case-converter` |
| 16 | Images | Image Compressor | `/tools/image-compressor` |
| 17 | Images | JPG Compressor | `/tools/jpg-compressor` |
| 18 | Images | PNG Compressor | `/tools/png-compressor` |
| 19 | Images | Image Resizer | `/tools/image-resizer` |
| 20 | Images | Image Cropper | `/tools/image-cropper` |
| 21 | Images | JPG to PNG Converter | `/tools/jpg-to-png` |
| 22 | Images | PNG to JPG Converter | `/tools/png-to-jpg` |
| 23 | PDF | Image to PDF Converter | `/tools/image-to-pdf` |
| 24 | PDF | PDF to JPG Converter | `/tools/pdf-to-jpg` |
| 25 | PDF | JPG to PDF Converter | `/tools/jpg-to-pdf` |
| 26 | PDF | PDF Compressor | `/tools/pdf-compressor` |
| 27 | PDF | PDF Merger | `/tools/pdf-merger` |
| 28 | PDF | PDF Splitter | `/tools/pdf-splitter` |
| 29 | Business | Invoice Generator | `/tools/invoice-generator` |
| 30 | Business | Receipt Generator | `/tools/receipt-generator` |

Do not create indexable aliases for these routes. If a slug ever changes, add a permanent redirect and retain one canonical destination.

---

## 5. Experience requirements

### 5.1 Site shell

The global header MUST contain the logo/home link, desktop category navigation, mobile menu, and site search trigger. The footer MUST contain category links, About, Privacy, Terms, Contact, and a concise local-processing statement.

The homepage MUST include:

1. one-sentence value proposition;
2. tool search with results grouped by category;
3. five category cards;
4. a curated popular-tools section sourced from registry flags, not page-view manipulation;
5. privacy and “no signup” benefits;
6. short editorial copy explaining what the site offers.

Category pages MUST include a distinct introduction, a card for each tool in the category, useful selection guidance, and links to adjacent categories. They must not be a thin list of links.

### 5.2 Tool page anatomy

Every tool page MUST render in this order:

1. breadcrumb navigation;
2. H1 and a concise, tool-specific value proposition;
3. privacy badge when processing is local;
4. interactive tool card;
5. result/output region announced accessibly;
6. concise “How to use” steps;
7. worked example or use cases;
8. methodology/formula or file-processing explanation;
9. limitations and privacy notes;
10. visible FAQs;
11. three to six manually curated related tools.

The primary action MUST be visible without excessive scrolling on common mobile sizes. Instructions and SEO content must not push the working utility below a long preamble.

### 5.3 Interaction conventions

- Forms use persistent labels, optional helper text, and inline validation.
- Required fields use semantic `required` where appropriate.
- Numeric fields accept decimal input when valid, show the unit next to the input, and reject non-finite values.
- Buttons have action-specific labels: “Calculate payment,” “Compress image,” “Merge PDFs,” not “Submit.”
- Long tasks show determinate progress when it can be measured, otherwise an honest busy state.
- Cancel MUST be available for multi-page PDF rendering and other operations likely to exceed two seconds.
- Results MUST not clear inputs unexpectedly.
- Reset MUST restore documented defaults and revoke old object URLs.
- Copy controls MUST show a non-color-only success confirmation.
- Downloads MUST use meaningful sanitized filenames and correct MIME types.
- Destructive removal of one queued file is immediate and reversible through re-selection; “Clear all” asks for confirmation only when there is meaningful unsaved work.
- Drag-and-drop zones MUST also be usable through a standard file input.
- File validation occurs before expensive decoding and explains supported types and limits.

### 5.4 Responsive behavior

- Mobile-first layout from 320 px upward.
- Single-column tool forms on small screens; result panels may become side-by-side when there is enough width.
- Touch targets are at least 44 × 44 CSS pixels.
- Data tables scroll within their container or transform into labeled rows.
- PDF page and image thumbnail lists use responsive grids and lazy thumbnails.
- Sticky controls MAY be used on crop/edit screens but cannot obscure content or consent controls.

### 5.5 Accessibility

Target WCAG 2.2 AA.

- Use native elements before ARIA.
- Provide a skip link and visible keyboard focus.
- Preserve logical heading order and landmarks.
- Inputs expose label, description, error, and unit relationships.
- Results use `aria-live="polite"`; blocking failures use an alert pattern without repeatedly stealing focus.
- Drop zones, sliders, crop handles, sortable file lists, dialogs, tabs, and menus must be keyboard-operable.
- Do not use color alone for status or chart meaning.
- Meet contrast requirements in light and dark themes if dark mode is included.
- Honor `prefers-reduced-motion`.
- Canvas-based previews require an adjacent textual description and conventional controls.
- Generated PDFs should include meaningful document metadata. Tagged-PDF generation is desirable but not a v1 promise unless the selected library supports it correctly.

### 5.6 Error language

Errors must say what happened and how to recover. Examples:

- “This file is 27 MB. The current limit is 20 MB per image.”
- “This PDF is encrypted. Remove its password in an authorized PDF editor, then try again.”
- “The selected pages are outside this 12-page document. Enter a range from 1 to 12.”

Do not expose stack traces or library error strings to users.

---

## 6. Functional requirements for all 30 tools

### Shared calculator rules

- Use pure TypeScript functions for formulas and date math.
- Inputs and results must not rely on locale-formatted strings internally.
- Format outputs with `Intl.NumberFormat`; let the user select or enter currency where money is displayed.
- Do not imply that projections are guarantees.
- Provide a calculation breakdown, not only one final number.
- Shareable query parameters MAY encode non-sensitive calculator inputs, but canonical URLs must exclude query strings and pages must not render secret/private values into metadata.

### 6.1 Percentage Calculator

Support three modes:

1. “What is X% of Y?”: result = `Y × X / 100`.
2. “X is what percent of Y?”: result = `X / Y × 100`; reject `Y = 0`.
3. “Percentage change from X to Y”: result = `(Y − X) / |X| × 100`; reject `X = 0` and explain why.

Requirements:

- Allow negative values and decimals.
- Show the substituted equation and rounded display result while retaining full internal precision.
- Let the user choose display precision from 0–10 decimal places; default 2.
- Distinguish percentage increase from decrease.
- Copy result.

### 6.2 Loan Calculator

Inputs: principal, annual percentage rate, term value, term unit (years/months), payment frequency (monthly required; biweekly MAY be added), currency, optional extra monthly payment, optional start date.

For monthly payments where monthly rate `r > 0` and number of payments is `n`, calculate `P × r(1+r)^n / ((1+r)^n − 1)`. At 0% interest, payment is `P / n`.

Outputs:

- scheduled payment;
- payoff time with extra payment;
- total principal, total interest, and total paid;
- amortization table showing payment number/date, payment, principal, interest, and remaining balance;
- yearly summary;
- CSV download of the amortization schedule.

Edge rules:

- Principal and term must be greater than zero; APR cannot be negative.
- The last payment must be capped so the balance never goes materially below zero.
- Warn when the extra-payment scenario is nonsensical or numerical iteration exceeds a safe cap.
- State that fees, variable rates, taxes, and lender-specific rounding are excluded.

### 6.3 Mortgage Calculator

Inputs: home price, down payment as amount or percent, annual interest rate, term, start date, annual property tax, annual home insurance, monthly HOA, optional recurring extra principal, currency.

Outputs:

- principal-and-interest payment;
- estimated total monthly housing payment with an itemized breakdown;
- loan amount and loan-to-value ratio;
- total interest and total payments;
- amortization schedule and yearly summary;
- CSV export.

Use the fixed-rate amortization formula from the loan calculator. Down-payment amount and percentage remain synchronized. Reject down payment greater than home price. Private mortgage insurance, closing costs, escrow rules, and changing taxes are excluded unless separately and explicitly implemented. Label every output as an estimate and include a financial-information disclaimer.

### 6.4 Compound Interest Calculator

Inputs: initial principal, annual rate, duration in years/months, compounding frequency (daily, monthly, quarterly, semiannual, annual), optional recurring contribution, contribution frequency, contribution timing (beginning/end of period), currency.

Outputs:

- ending balance;
- total contributions;
- total interest earned;
- yearly balance table;
- accessible visual breakdown or chart with a table equivalent;
- CSV export.

Calculation MUST model recurring contributions on the selected schedule rather than applying an inaccurate lump-sum shortcut. Support a 0% rate. Negative rates MAY be accepted down to greater than −100%, with clear validation and tests, or deliberately rejected with that limitation documented.

### 6.5 Salary Calculator

This is a pay-frequency converter, not a tax/payroll calculator.

Inputs: salary/pay amount, source frequency (hourly, daily, weekly, biweekly, semimonthly, monthly, annual), hours per week, workdays per week, paid weeks per year, currency.

Outputs: equivalent hourly, daily, weekly, biweekly, semimonthly, monthly, and annual gross pay.

Rules:

- Default to 40 hours/week, 5 workdays/week, and 52 paid weeks/year.
- Derive annual pay first and derive all target periods from that normalized value.
- Semimonthly = 24 pay periods/year; biweekly = 26.
- Explain that taxes, unpaid leave, overtime premiums, benefits, and local payroll rules are excluded.
- Do not call the result “take-home pay.”

### 6.6 Age Calculator

Inputs: date of birth and “age on” date (default today in the browser's local calendar).

Outputs:

- calendar age in completed years, months, and days;
- total completed months, weeks, and days;
- day of week born;
- next birthday date and days until next birthday.

Requirements:

- Use date-only calendar arithmetic; do not let UTC conversion move the selected date.
- Reject a birth date after the target date.
- Define February 29 birthday handling for non-leap years. Use February 28 by default and disclose it.
- Total days must be based on local calendar dates, not milliseconds divided by 86,400,000 across daylight-saving transitions.

### 6.7 Date Difference Calculator

Inputs: start date, end date, include-end-date toggle, exclude weekends toggle.

Outputs:

- signed calendar difference in years/months/days;
- total calendar days and weeks plus days;
- weekdays/business days when requested;
- earlier/later relationship.

Rules:

- Work for either date order.
- Define whether the first and last day are included.
- Weekend means Saturday/Sunday in v1; public holidays are excluded from scope.
- Use date-only arithmetic robust to daylight-saving changes.

### 6.8 BMI Calculator

Inputs: unit system (metric/US customary), weight, height, optional age (for context only; adult classification requires age ≥20).

Formula: metric `kg / m²`; US customary `703 × lb / in²`.

Outputs:

- BMI to one decimal;
- adult category using standard thresholds: underweight `<18.5`, healthy `18.5–24.9`, overweight `25.0–29.9`, obesity `≥30`;
- healthy adult weight range for the entered height.

Requirements:

- For users under 20, do not apply adult categories; explain that age- and sex-specific growth charts are required.
- Include a prominent informational-not-medical-advice notice.
- Explain limitations for pregnancy, high muscularity, older adults, and population differences.
- Do not collect or infer sensitive health data through analytics.

### 6.9 Calorie Calculator

Use the Mifflin–St Jeor resting metabolic rate equations:

- male: `10W + 6.25H − 5A + 5`;
- female: `10W + 6.25H − 5A − 161`;

where `W` is kg, `H` is cm, and `A` is age in years.

Inputs: unit system, age, sex used by the equation (label this clearly), weight, height, and activity level. Activity multipliers: sedentary 1.2, lightly active 1.375, moderately active 1.55, very active 1.725, extra active 1.9.

Outputs:

- estimated BMR;
- estimated maintenance calories/TDEE;
- conservative illustrative targets for slow loss/gain using ±250 and ±500 kcal/day, with safety wording.

Requirements:

- Adults only in v1; validate age 18–100.
- Explain the formula and that activity multipliers are approximations.
- Avoid definitive medical claims and warn against overly low intake. Do not present a target below 1,200 kcal for women or 1,500 kcal for men without an explicit professional-supervision warning.
- Make clear that individual needs vary and users with health conditions should consult a qualified professional.

### Shared text/developer rules

- Text remains in memory on the device and is cleared on reset/refresh unless a feature explicitly says otherwise.
- Copy operations use the Clipboard API with an accessible fallback/error.
- Handle Unicode intentionally and test non-Latin scripts and emoji.

### 6.10 QR Code Generator

Modes: URL, plain text, email, phone, SMS, and Wi-Fi.

Inputs vary by mode and MUST generate correctly formatted payloads. Wi-Fi supports SSID, password, encryption (WPA/WEP/none), and hidden-network flag. URL mode validates and, when a scheme is absent, offers to prepend `https://` rather than silently guessing.

Options: size, error correction level, foreground/background colors, quiet zone, and output format.

Outputs:

- live preview;
- PNG download;
- SVG download;
- copy image where supported.

Requirements:

- Use a maintained QR encoder locally; no third-party QR API.
- Keep sufficient color contrast and warn when chosen colors may scan poorly.
- Never place branding over the code in v1.
- Add automated decode round-trip tests for representative payloads.

### 6.11 Password Generator

Inputs: length 8–128, uppercase, lowercase, numbers, symbols, exclude ambiguous characters, and optional “require at least one from every selected set.” Default: length 20 and all sets enabled.

Requirements:

- Generate randomness only with `crypto.getRandomValues`; never use `Math.random`.
- Avoid modulo bias by rejection sampling.
- Reject a configuration with no selected character sets or a required-set count greater than length.
- Shuffle required characters using cryptographically secure random values.
- Show a transparent strength/entropy estimate based on selected alphabet and length; do not claim breach resistance.
- Generate, regenerate, reveal/hide, and copy. Do not persist, log, or send the password.

### 6.12 UUID Generator

Generate RFC 4122/9562-compatible version 4 UUIDs using `crypto.randomUUID()` where available, with a Web Crypto fallback.

Inputs: quantity 1–100, uppercase toggle, braces toggle, hyphen toggle. Default output remains conventional lowercase with hyphens.

Outputs: one-per-line list, copy all, and download `.txt`.

Validate generated canonical UUIDs with the version nibble `4` and variant bits. Decorative formatting is applied only after valid UUID generation.

### 6.13 Word Counter

Input: multiline text.

Outputs update as the user types:

- words;
- characters with spaces;
- characters without whitespace;
- sentences;
- paragraphs;
- estimated reading time;
- estimated speaking time;
- top keywords excluding a small documented stop-word list.

Use `Intl.Segmenter` for word/sentence segmentation when available and a documented fallback. Count only word-like segments as words. Reading/speaking rates are user-adjustable with sensible defaults (200 and 130 words/minute). Keyword analysis must stay local and be labeled approximate.

### 6.14 Character Counter

Input: multiline text and an optional character limit.

Outputs:

- Unicode grapheme count (what users perceive as characters);
- UTF-16 code-unit count, labeled “technical length”;
- characters excluding whitespace;
- UTF-8 byte size;
- line and paragraph counts;
- remaining/over-limit count.

Use `Intl.Segmenter` with grapheme granularity when available and a documented fallback. A family emoji or combined diacritic sequence should count as one visible character in supported browsers.

### 6.15 Case Converter

Transform input into:

- lowercase;
- UPPERCASE;
- Sentence case;
- Title Case;
- camelCase;
- PascalCase;
- snake_case;
- kebab-case;
- CONSTANT_CASE;
- alternating case.

Requirements:

- Preserve the original text until reset; transformed output is separately copyable/downloadable.
- Provide locale selection for locale-aware lower/uppercase behavior, defaulting to browser locale.
- Document Title Case limitations; do not claim perfect language-aware editorial capitalization.
- Treat punctuation, repeated whitespace, apostrophes, digits, emoji, and line breaks predictably and test them.
- Alternating case must be deterministic and ignore non-letter characters when advancing alternation.

### Shared image rules

- Decode, transform, and encode locally using browser APIs and/or a worker.
- Accept only explicitly supported MIME types verified from file signature where practical, not only filename extension.
- Default maximum: 20 MB per image, 40 megapixels after decoding, 20 queued files where batch mode is supported. Put these limits in one configuration file.
- Correct EXIF orientation before transformations, then strip metadata by default for privacy.
- Preserve transparency only in formats that support it.
- Revoke object URLs and release canvases/ImageBitmaps after use.
- Move expensive loops off the main thread when practical; the interface must remain responsive.
- Provide original/output dimensions, bytes, percentage saved/increased, and per-file status.
- A larger output is possible. Say so and let the user keep the original.
- Do not promise HEIC/AVIF input unless runtime support is detected and tested.

### 6.16 Image Compressor

Accept JPEG, PNG, and WebP. Support one or multiple files.

Inputs/options: output format (`same`, JPEG, PNG, WebP), quality when meaningful, optional max width/height, preserve aspect ratio, strip metadata (on by default).

Outputs: per-file before/after preview and size, individual download, and ZIP download for two or more successful outputs.

Requirements:

- Never upscale while compressing.
- For `same`, retain the original supported format.
- Explain that PNG is lossless by default and the browser's PNG encoder may not materially reduce size.
- Keep alpha when output is PNG/WebP; when output is JPEG, let the user choose the matte color, default white.

### 6.17 JPG Compressor

Accept JPEG/JPG only. Support batch operation. Controls: quality, optional target maximum dimensions, metadata stripping.

Requirements:

- Output valid JPEG with `.jpg` extension and `image/jpeg` MIME type.
- Preserve aspect ratio and apply EXIF orientation.
- Show a warning for quality settings likely to create visible artifacts.
- Optional target-size mode MAY iteratively search quality, but must be labeled approximate and must never guarantee an exact byte count.

### 6.18 PNG Compressor

Accept PNG only, including transparency.

Provide two explicit modes:

1. Lossless optimization: preserve pixels/alpha. If the chosen browser implementation cannot make the file smaller, return the original with an explanation.
2. Smaller file (lossy): optional color reduction/quality strategy, clearly labeled as potentially changing colors.

Do not convert to JPEG while still labeling the output PNG. Animated PNG is outside v1; detect and reject or clearly state only the first/default image is supported—rejecting is preferred.

### 6.19 Image Resizer

Accept JPEG, PNG, and WebP. Inputs: width, height, unit (pixels and percentage), lock aspect ratio, fit mode (contain/cover/stretch, with stretch visually warned), resampling quality, output format, quality, and matte for JPEG.

Requirements:

- Synchronize dimensions when aspect lock is on.
- Avoid accidental zero/negative dimensions and cap output by configured megapixels.
- Show resulting dimensions before download.
- Support common presets (social/profile/document) only when each preset displays its exact pixel dimensions; presets must not become separate SEO pages in v1.

### 6.20 Image Cropper

Accept one JPEG, PNG, or WebP file.

Features:

- free crop and aspect presets: free, 1:1, 4:3, 3:2, 16:9;
- zoom, rotate in 90-degree increments, horizontal/vertical flip;
- pointer, touch, and keyboard control;
- precise numeric x/y/width/height fields;
- output format and JPEG/WebP quality;
- reset and download.

The crop must be computed in source-image coordinates so preview scaling does not reduce export resolution. Prevent crop area from leaving source bounds.

### 6.21 JPG to PNG Converter

Accept JPEG/JPG, batch supported. Decode with orientation correction and export valid PNG. Show before/after sizes and explain that conversion to PNG often increases file size and does not restore lost quality or transparency.

### 6.22 PNG to JPG Converter

Accept PNG, batch supported. Inputs: JPEG quality and background/matte color. Composite transparent pixels onto the selected matte before JPEG encoding. Default matte is white. Explain that transparency is removed and conversion is lossy.

### Shared PDF rules

- Process files locally. No file bytes leave the browser.
- Default maximum: 100 MB per PDF, 500 pages, and 10 input PDFs for merging; centralize and document limits.
- Detect encrypted/password-protected PDFs and show a safe unsupported message. Do not implement password circumvention.
- Preserve source page dimensions when copying pages unless a tool explicitly rasterizes.
- Keep page ordering explicit and keyboard-accessible.
- Use lazy thumbnails and worker-based parsing/rendering where supported.
- Object URLs and large buffers must be released after download/reset.
- A corrupted file must fail cleanly without freezing the page.

### 6.23 Image to PDF Converter

Accept JPEG, PNG, and WebP images; allow multiple files with drag/keyboard reordering.

Options: page size (fit image, A4, US Letter), orientation (auto/portrait/landscape), margins, image fit (contain/cover), optional filename/title metadata.

Output: one PDF containing one page per image in the chosen order.

Requirements:

- Preserve image aspect ratio by default.
- Warn before cover mode crops content.
- Correct source orientation.
- PDF pages must have the selected physical size and valid downloadable bytes.

### 6.24 PDF to JPG Converter

Accept one PDF. Render selected pages to JPEG.

Inputs: page selection (`all`, individual pages, comma-separated ranges), output scale/DPI preset, JPEG quality, background color.

Outputs: page thumbnails, individual JPG downloads, ZIP for multiple pages.

Requirements:

- Use PDF.js in a dedicated worker configured correctly for production.
- Render each selected page at a clear, documented scale; cap total output pixels to prevent memory exhaustion.
- Filenames use zero-padded page numbers, e.g. `document-page-001.jpg`.
- Explain that selectable text becomes pixels and that complex PDF rendering may vary from the original viewer.

### 6.25 JPG to PDF Converter

Accept JPEG/JPG only and otherwise match Image to PDF behavior. This dedicated route exists for a distinct, common intent but should reuse the same tested PDF assembly engine and UI configuration rather than duplicate code.

### 6.26 PDF Compressor

Provide honest modes and do not promise lossless dramatic compression:

1. **Optimize structure**: remove unneeded metadata and rewrite the PDF where the library safely supports it. Preserve vectors/text when possible; savings may be small or zero.
2. **Rasterize pages**: render pages to compressed images and create a new PDF. Offer quality/DPI controls and display a strong warning that selectable text, links, forms, annotations, accessibility structure, and vector quality may be lost.

Requirements:

- Default to structure optimization.
- Compare before/after bytes and never claim success solely because the process completed.
- If output is larger, say so and make the original the recommended choice.
- Preserve page count and page dimensions within tolerance.
- The acceptance suite must verify that each page is renderable, not merely that a PDF header exists.

### 6.27 PDF Merger

Accept 2–10 PDFs. Show filename, size, page count, and thumbnail/first-page indicator. Allow keyboard-accessible file reordering and removal. Output one PDF with all pages in the displayed order.

Requirements:

- Copy pages without rasterizing them.
- Keep original page dimensions and rotations.
- Set minimal output metadata without leaking local file paths.
- If one input fails validation, identify it and leave the other selected files intact.

### 6.28 PDF Splitter

Accept one PDF. Modes:

- extract selected pages/ranges into one PDF;
- split every page into a separate PDF;
- split by ranges into multiple PDFs;
- remove selected pages and save the remainder.

Requirements:

- Support syntax such as `1-3, 5, 8-10`; normalize whitespace, reject overlaps only if they would cause ambiguous duplication, and explain invalid tokens.
- Page selection preview must clearly show what will be produced.
- Use ZIP when more than one output PDF is created.
- Preserve original page dimensions and rotation.

### Shared business-document rules

- No account or backend in v1.
- Draft persistence, if enabled, uses `localStorage` only, is opt-in or clearly disclosed, and includes “Delete saved draft.”
- Never send contact, customer, pricing, tax, or line-item data to analytics.
- Currency uses ISO 4217 codes with sensible formatting; permit a custom symbol only as a presentation option.
- Monetary calculations use integer minor units or a decimal arithmetic library, never raw binary floating-point addition.
- PDF and print output must be clean, professional, and usable on A4 and US Letter.
- Users must be able to preview before download.

### 6.29 Invoice Generator

Fields:

- business name, logo (local only), address, email, phone, tax/business ID;
- bill-to name and address;
- invoice number, issue date, due date, currency;
- line items: description, quantity, unit price, optional per-line discount or tax only if the model remains unambiguous;
- document-level discount, shipping/fee, tax label and percentage/amount;
- notes, payment instructions, terms;
- optional paid amount for balance-due display.

Requirements:

- Add/remove/reorder line items.
- Calculate subtotal, discounts, tax, fees, total, paid, and balance due deterministically.
- Clearly define whether tax is applied before or after document discount; default to after discount and test it.
- Prevent due date before issue date unless user explicitly confirms the unusual state.
- Generate print view and downloadable PDF.
- Logo is downscaled client-side to a safe size and embedded without upload.
- Include at least two tasteful templates that share the same data model.
- Do not call invoices legally compliant for every jurisdiction. Explain that numbering, tax, and recordkeeping rules vary.

### 6.30 Receipt Generator

Fields:

- seller name/logo/contact details;
- receipt number and transaction date/time;
- customer name (optional);
- line items: description, quantity, unit price;
- discount, tax, fee/tip, total;
- amount tendered and change (optional);
- payment method;
- notes and return-policy text.

Requirements:

- Generate compact receipt and full-page styles.
- Calculate subtotal, adjustments, total, amount received, and change using decimal-safe arithmetic.
- Clearly label generated output as a receipt, not an invoice.
- Print and PDF download.
- Do not imply that the generated receipt proves a transaction occurred. Include an appropriate terms notice.

---

## 7. Architecture

### 7.1 Rendering model

Use the App Router. Pages, explanatory content, metadata, navigation, and FAQs should be Server Components by default. The interactive tool implementation is a dynamically loaded Client Component inside the server-rendered page.

The route `/tools/[slug]` should use `generateStaticParams()` from a typed registry so all 30 tool pages are prerendered at build time. Use `generateMetadata()` to derive unique metadata from the same registry. A missing slug returns `notFound()`.

Keep server rendering available even though v1 tool processing is local. Do not set `output: 'export'` by default; make static export an optional documented deployment profile only if all chosen metadata/route features remain compatible. Next.js supports static HTML export through `output: 'export'`, but server-only features are unavailable in that mode.

### 7.2 Recommended source tree

```text
app/
  (marketing)/
    page.tsx
    about/page.tsx
    privacy/page.tsx
    terms/page.tsx
    contact/page.tsx
  (categories)/
    calculators/page.tsx
    text-developer-tools/page.tsx
    image-tools/page.tsx
    pdf-tools/page.tsx
    business-tools/page.tsx
  tools/
    [slug]/
      page.tsx
      loading.tsx
      not-found.tsx
  layout.tsx
  error.tsx
  global-error.tsx
  not-found.tsx
  robots.ts
  sitemap.ts
  manifest.ts
  opengraph-image.tsx
components/
  layout/
  navigation/
  seo/
  tool-shell/
  forms/
  feedback/
  files/
  charts/
  ads/
  tools/
    calculators/
    text/
    images/
    pdf/
    business/
content/
  tools/
    percentage-calculator.ts
    ...one reviewed content module per tool
lib/
  registry/
    categories.ts
    tools.ts
    schema.ts
  calculators/
  text/
  image/
  pdf/
  documents/
  validation/
  formatting/
  download/
  analytics/
  seo/
  config/
workers/
  image.worker.ts
  pdf.worker.ts
public/
tests/
  unit/
  component/
  e2e/
  fixtures/
```

Colocate tests when the repository convention prefers it. The important constraint is separation between pure domain logic, interactive UI, editorial content, and route configuration.

### 7.3 Tool registry

Create one typed registry entry per route. A representative shape:

```ts
type ToolCategory =
  | 'calculators'
  | 'text-developer-tools'
  | 'image-tools'
  | 'pdf-tools'
  | 'business-tools';

type ToolDefinition = {
  slug: string;
  name: string;
  shortName: string;
  category: ToolCategory;
  description: string;
  title: string;
  primaryKeyword: string;
  relatedSlugs: readonly string[];
  icon: string;
  localProcessing: boolean;
  featured: boolean;
  componentKey: string;
  updatedAt: string;
};
```

At startup/build time, validate with code or schema checks that:

- slugs and component keys are unique;
- all related slugs exist and do not point to themselves;
- each route belongs to a known category;
- title/description lengths are reasonable;
- exactly 30 launch tools exist;
- every entry has a component and content module;
- the sitemap and category navigation include every canonical tool exactly once.

### 7.4 Shared components

At minimum, implement:

- `SiteHeader`, `MobileNav`, `SiteFooter`, `Breadcrumbs`;
- `ToolSearch` with keyboard navigation;
- `CategoryCard`, `ToolCard`, `RelatedTools`;
- `ToolPageLayout`, `ToolPanel`, `ResultPanel`, `PrivacyBadge`;
- `Field`, `NumberField`, `UnitField`, `SelectField`, `SwitchField`, `ColorField`;
- `FileDropzone`, `FileQueue`, `FileRow`, `PageRangeInput`, `SortableList`;
- `Progress`, `InlineError`, `ErrorSummary`, `EmptyState`, `Toast`;
- `CopyButton`, `DownloadButton`, `ResetButton`;
- `FormulaBlock`, `WorkedExample`, `HowToSteps`, `FAQList`;
- `AdSlot` that reserves dimensions and renders nothing when ads are disabled;
- `ConsentBanner` only if required by the selected analytics/advertising configuration.

Avoid a single mega-component controlled by dozens of flags. Share low-level behavior and domain engines; keep each tool's form readable.

### 7.5 Domain modules

- Calculator functions are deterministic, side-effect free, and independent of React.
- Money calculations use a decimal-safe representation.
- Date-only calculations use a well-tested calendar-date strategy and never depend on parsing `YYYY-MM-DD` as UTC.
- File sniffing and validation are centralized.
- Download helpers own object URL creation/revocation and filename sanitation.
- Image transforms share decoding, orientation, canvas/worker, and encoding functions.
- PDF tools share loading, encryption detection, page-range parsing, and output validation.
- Invoice and receipt renderers share the line-item/money model but keep distinct document semantics.

### 7.6 Suggested dependencies

Choose the smallest maintained libraries that satisfy the requirements and verify their licenses and browser support before installation. Suitable candidates include:

- UI/forms: React Hook Form and Zod, or an equally typed alternative;
- accessible unstyled primitives: Radix UI only where native HTML is insufficient;
- styling: Tailwind CSS or CSS Modules; use one system consistently;
- icons: Lucide, imported per icon;
- QR: a local QR encoding library with SVG and canvas output;
- PDF assembly/manipulation: `pdf-lib`;
- PDF rendering: `pdfjs-dist`, with an explicit worker configuration;
- ZIP: `fflate` or another small streaming-capable browser library;
- decimal money: `decimal.js`, `big.js`, or integer-minor-unit utilities;
- tests: Vitest + Testing Library for unit/components, Playwright for end-to-end;
- accessibility checks: `axe-core`/Playwright integration.

Do not add a library when a short, security-sensitive Web API implementation is clearer—for example, use Web Crypto directly for passwords and UUIDs. Pin dependencies through the lockfile, use automated update checks, and remove unused packages.

### 7.7 State and persistence

- Prefer component-local state and reducers.
- Use URL query state only for non-sensitive calculator values and only when it improves sharing.
- Use `localStorage` only for explicit preferences (theme, units) and optional invoice/receipt drafts.
- Version persisted schemas and recover safely from invalid old data.
- Do not introduce a global state library unless demonstrated cross-route state requires it.

### 7.8 Concurrency and memory

- Dynamically import large PDF, image, ZIP, chart, and business-PDF modules only on their routes.
- Lazy-load PDF.js worker and large renderers after user interaction where possible.
- Limit concurrent image/PDF jobs; a queue of 1–2 expensive operations is acceptable.
- Use `AbortController` or equivalent cancellation where libraries support it.
- Release canvases by clearing dimensions, close `ImageBitmap`s, and revoke URLs.
- Guard decoded pixel count before allocating output canvas memory.
- Never read arbitrarily large files into multiple redundant buffers.

### 7.9 Security and privacy

- No user file upload endpoints in v1.
- Set a restrictive Content Security Policy compatible with workers, blob previews, analytics, and any later ad provider. Avoid `unsafe-eval`; minimize `unsafe-inline` through nonces/hashes as deployment allows.
- Add `X-Content-Type-Options: nosniff`, a conservative `Referrer-Policy`, `Permissions-Policy`, frame-ancestor protection, and HTTPS/HSTS in production.
- Sanitize filenames for downloads and never inject filenames/text through `dangerouslySetInnerHTML`.
- Render user-entered invoice/receipt text as text nodes. If rich text is added later, sanitize it with an allowlist.
- Validate file signatures and sizes; treat all file content as untrusted.
- Protect long-running decoders with limits and cancellation.
- Keep dependency audit output actionable; a passing audit is not a substitute for file limits and safe rendering.
- Avoid embedding third-party resources on tool pages by default.
- Analytics events use enums/buckets, not raw values or filenames.

### 7.10 Configuration

Centralize:

- `NEXT_PUBLIC_SITE_URL`;
- brand name and legal/contact values;
- analytics provider/ID and enable flag;
- ad provider/ID and enable flag;
- file size, page count, pixel, queue, and concurrency limits;
- feature flags for draft persistence and optional static-export mode.

Provide `.env.example` with non-secret placeholders. Fail the production build or emit an unmistakable deployment warning when the canonical site URL is missing. Never commit secrets.

---

## 8. SEO and content requirements

### 8.1 Technical SEO

- Every indexable route has a self-referencing absolute canonical URL.
- Titles and meta descriptions are unique and helpful, not formulaic keyword stuffing.
- Set `metadataBase` from the validated production URL.
- Provide Open Graph and Twitter metadata plus a site-wide default image; tool-specific images MAY be generated later.
- Generate `/sitemap.xml` from the registry and core static routes using Next.js metadata-file conventions.
- Generate `/robots.txt`; allow production public routes, disallow preview/internal paths, and reference the sitemap.
- Preview/staging deployments MUST send `noindex` and should be access-restricted.
- Return true 404 status for unknown slugs.
- Redirect host/protocol duplicates to one origin and choose a consistent trailing-slash policy.
- Do not index URL search/filter/query combinations; canonicalize to the clean tool URL.
- Use semantic breadcrumbs and add valid `BreadcrumbList` JSON-LD.

### 8.2 Structured data

Tool pages MAY include `WebApplication` or `SoftwareApplication` JSON-LD when all properties are accurate. Category and site pages may use `WebSite`/`Organization` where appropriate. FAQ schema may be used only for visible page FAQs and must match them exactly. Do not add review ratings, prices, claims, or publisher data that do not exist.

Validate representative pages with schema tools and ensure JSON-LD is serialized safely.

### 8.3 Page content

Each tool content module MUST be edited for that tool and include:

- 40–100 word direct introduction;
- three to five usage steps;
- at least one worked example or concrete use case;
- formula/method explanation where applicable;
- limitations and privacy note;
- three to six FAQs with concise original answers;
- related tools selected for genuine task adjacency.

There is no arbitrary word-count target. Content should answer user questions without burying the tool. Do not duplicate paragraphs across all 30 pages except short shared legal/privacy disclosures.

### 8.4 Internal linking

- Homepage links to all categories and selected tools.
- Category pages link to every tool in that category.
- Every tool links to its category and three to six related tools.
- Link text describes the destination.
- Links are real `<a>` elements via Next.js `Link`, crawlable without click handlers.
- Automated tests ensure there are no orphan tool routes or broken internal links.

### 8.5 Content trust

- About page explains ownership and editorial/testing approach.
- Calculator pages cite formula/method sources in their editorial content where appropriate.
- Health/financial calculators include scope-specific disclaimers near results, not only in Terms.
- Display “Last reviewed” dates only when maintained from real review records; do not fabricate freshness.
- Do not promise “100% secure,” “perfect accuracy,” “best,” or exact compression outcomes.

### 8.6 Performance and crawlability

- Server-render H1, intro, instructions, FAQs, and links. Do not require JavaScript for search engines to discover them.
- Keep heavy tool bundles route-scoped.
- Reserve preview/result/ad dimensions to minimize CLS.
- Use fonts efficiently: system stack or self-hosted subset, with sensible fallback.
- Avoid autoplay media, large hero images, and third-party scripts during the initial launch.

Official implementation references:

- [Next.js App Router documentation](https://nextjs.org/docs/app)
- [Next.js metadata and Open Graph guidance](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Next.js sitemap file convention](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js static export guidance](https://nextjs.org/docs/app/guides/static-exports)

---

## 9. Visual design system

Aim for a calm, trustworthy utility product rather than a content farm.

### Tokens

- Define color, typography, space, radius, shadow, border, focus, and motion tokens with CSS custom properties.
- Use a neutral background, high-contrast body text, and one restrained brand accent.
- Success, warning, and error colors need text/icon reinforcement.
- Maximum editorial line length: approximately 70–75 characters.
- Tool panel content width should support forms without becoming excessively wide.

### Component states

Every interactive primitive needs default, hover, focus-visible, active, disabled, loading, error, and success behavior as applicable. Skeletons should resemble final layout and not delay already available explanatory HTML.

### Ads

Build inert `AdSlot` placeholders for possible future placements:

- one below the initial result/action area, never between input and primary action;
- one within long editorial content after useful material;
- optional desktop rail only when width permits.

Slots reserve exact dimensions when enabled. Never disguise ads as download buttons or place an ad where users are likely to click accidentally. Ads remain disabled for launch until legal consent, policy, and performance work is complete.

---

## 10. Testing strategy

Use the current Next.js-supported testing approaches: Vitest for pure logic/component tests and Playwright for real-browser flows. Next.js notes that end-to-end coverage is particularly useful for async Server Components.

### 10.1 Required checks

Provide scripts equivalent to:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

CI runs lint, typecheck, unit/component tests, production build, and a focused E2E suite on every pull request. Full cross-browser and heavier file fixtures may run on main/nightly if CI time requires it.

### 10.2 Unit tests

At minimum cover:

- all calculator formulas, zero-rate paths, rounding, invalid denominators, and boundary values;
- amortization ending balance and totals;
- contribution timing in compound interest;
- leap years, month ends, date order, and DST-adjacent dates;
- Unicode segmentation and all case transformations;
- cryptographic character selection constraints and UUID format/variant/version;
- page-range parsing and normalization;
- file type/size/pixel/page validation;
- money/discount/tax calculations using decimal-safe arithmetic;
- filename sanitation and download MIME mapping;
- registry invariants and related-route integrity.

Reference examples:

- 20% of 50 = 10.
- 25 is 50% of 50.
- 80 to 100 = 25% increase.
- A 12-month, 0% loan of 1,200 has monthly payments totaling 1,200.
- BMI for 70 kg and 1.75 m is approximately 22.9.
- A leap-day/date-only case remains stable independent of process timezone.
- `👨‍👩‍👧‍👦` counts as one grapheme where `Intl.Segmenter` is available.
- Generated UUID v4 values match the version/variant pattern.
- `1-3, 5` produces pages 1,2,3,5 without off-by-one errors.
- Invoice subtotal 2 × 19.99 uses exact currency math.

### 10.3 Component/integration tests

- Validation messages are associated with fields.
- Mode switching preserves or resets values according to documented behavior.
- Copy success/error states work.
- Drop zone also works through file selection and keyboard activation.
- File queues reorder and remove correctly.
- Result areas announce changes.
- Invoice/receipt line items and totals update deterministically.
- Reset releases state and returns defaults.

### 10.4 File fixture tests

Keep small, licensed test fixtures in the repository:

- JPEG with EXIF rotations;
- transparent PNG;
- WebP;
- multi-page PDFs with mixed dimensions/rotation;
- encrypted PDF;
- malformed/truncated image and PDF;
- documents near configured limits where CI permits.

For generated outputs verify:

- magic bytes/MIME/extension agree;
- image dimensions, alpha behavior, and orientation are correct;
- PDFs parse, have expected page counts and dimensions, and render representative pages;
- ZIP entries have expected names and valid content;
- merge/split order matches the UI;
- invoice/receipt totals printed into output equal the UI totals.

### 10.5 End-to-end journeys

Test at least one complete journey per tool family in Chromium, Firefox, and WebKit, plus a focused smoke test for all 30 routes:

1. Navigate from homepage search to a calculator, calculate, copy, and reset.
2. Generate and decode a QR code.
3. Generate a constrained password without any network payload.
4. Compress/resize/crop images and validate downloads.
5. Convert, merge, split, and render PDFs using fixtures.
6. Complete an invoice and receipt, preview, print or download PDF.
7. Operate primary workflows using keyboard only.
8. Verify unknown slugs return 404 and canonical/metadata are correct.

### 10.6 Accessibility tests

- Automated axe scan for homepage, each category template, one route per tool family, and both business templates.
- Manual keyboard audit for menus, search, forms, file reordering, crop controls, dialogs, and downloads.
- Screen-reader smoke test with VoiceOver or NVDA for a calculator, a file tool, and invoice generator.
- Test 200% zoom, forced colors/high contrast where available, reduced motion, and 320 px viewport.

### 10.7 Performance tests

- Run Lighthouse on production builds for homepage, one calculator, image compressor, PDF merger, and invoice generator.
- Add bundle analysis and fail review when a shared bundle unexpectedly absorbs PDF/image libraries.
- Confirm heavy libraries are absent from unrelated route chunks.
- Test mid-tier mobile CPU/network conditions and large-but-valid inputs.
- Track Web Vitals in production without collecting tool content. Vercel supports Web Analytics and Speed Insights for Next.js deployments, or `useReportWebVitals` can send metrics to another provider.

### 10.8 Privacy regression test

During automated E2E runs, intercept network traffic while entering distinctive sentinel values and selecting fixtures. Fail if request URLs, headers, or bodies contain sentinel text, filenames, generated passwords, invoice data, or file content. Allow only expected static assets and deliberately enabled anonymous event names.

---

## 11. Implementation phases

Each phase ends with its tests passing and a usable production build. Do not wait until the final phase to add accessibility or tests.

### Phase 0 — Foundation and decisions

- Initialize Next.js, TypeScript strict mode, package manager, lint/format/test tooling.
- Write an architecture decision record for browser-only processing and deployment mode.
- Add security/privacy threat model and third-party license inventory.
- Create central config and `.env.example`.
- Set CI baseline.

Exit: blank shell builds, tests run, deployment preview works, and key dependency proof-of-concepts succeed for PDF rendering/manipulation and image encoding.

### Phase 1 — Shell, registry, content system, and SEO

- Build design tokens, shell, navigation, footer, search, category pages, tool page layout, legal/about pages, 404/error states.
- Implement typed 30-tool registry, static params, metadata, sitemap, robots, breadcrumbs, JSON-LD utilities, and related links.
- Add reviewed content-module schema with temporary development fixtures only; production cannot ship missing content.
- Establish accessibility and Lighthouse baselines.

Exit: all 30 canonical routes render unique static content shells, no orphan routes exist, and metadata/internals pass tests. Interactive placeholder panels must be visibly marked development-only and must not be deployable to production.

### Phase 2 — Calculators (tools 1–9)

- Build shared numeric, unit, result, table, chart, CSV, and disclaimer components.
- Implement pure domain modules and all nine calculator UIs.
- Add formula reference tests, DST/leap-day coverage, and E2E flows.

Exit: calculators meet §6, outputs show breakdowns, and all reference cases pass.

### Phase 3 — Text and developer tools (tools 10–15)

- Implement QR, password, UUID, counters, and case conversion.
- Add Unicode, cryptographic-randomness, and QR round-trip tests.

Exit: all copy/download flows work and no tool data reaches the network.

### Phase 4 — Image pipeline and tools (tools 16–22)

- Implement file validation/sniffing, EXIF orientation, worker pipeline, previews, output stats, ZIP, URL cleanup, and memory limits.
- Build all seven image routes by reusing the pipeline.
- Test alpha, orientation, dimensions, batch behavior, and abort/reset.

Exit: valid fixtures produce valid files across browsers; large inputs fail gracefully.

### Phase 5 — PDF pipeline and tools (tools 23–28)

- Integrate PDF rendering worker and PDF manipulation library.
- Implement shared page selectors, thumbnails, sorting, ZIP, limits, encrypted/corrupt handling, and cancellation.
- Build all six PDF tools, including honest compressor modes.
- Verify outputs by reparsing and rendering.

Exit: page order/count/dimensions are correct and PDF-heavy code remains route-scoped.

### Phase 6 — Business generators (tools 29–30)

- Implement decimal-safe document data model, line-item editor, totals, templates, logo handling, print CSS, local draft control, and PDF export.
- Add jurisdiction disclaimers and output parity tests.

Exit: invoice and receipt PDFs/print views match on-screen values and handle long content without clipping.

### Phase 7 — Hardening and launch

- Complete original editorial content and source review.
- Run full accessibility, privacy, security-header, cross-browser, file-fixture, SEO, link, bundle, and performance audits.
- Configure production environment, custom domain, analytics consent if used, Search Console, sitemap submission, monitoring, and backups of source/config.
- Keep ads disabled during baseline measurement.

Exit: all launch acceptance criteria pass, release is tagged, rollback is rehearsed, and post-launch checks are assigned.

### Recommended initial launch order if incremental release is required

If business constraints require shipping before all 30 are public, do not publish unfinished shells. Release completed routes in this order while keeping incomplete routes out of registry/sitemap/navigation:

1. percentage, salary, age, date difference;
2. password, UUID, word/character counter, case converter, QR;
3. image converters/resizer/compressors/cropper;
4. image/JPG to PDF, merger, splitter, PDF to JPG, compressor;
5. loan, mortgage, compound interest, BMI, calorie;
6. invoice and receipt generators.

The final contracted scope remains all 30 tools.

---

## 12. Acceptance criteria

### Site-wide release gate

- [ ] Production navigation exposes exactly the 30 specified tools and five category pages.
- [ ] Every tool performs its advertised core action; no placeholder or dead control remains.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build` pass.
- [ ] All canonical routes return 200; unknown tool slugs return 404.
- [ ] Titles, descriptions, H1s, canonicals, and editorial copy are unique and appropriate.
- [ ] Sitemap contains all intended public routes exactly once and robots references it.
- [ ] Preview/staging is noindexed; production is indexable.
- [ ] Core workflows function at 320 px and with keyboard only.
- [ ] Representative automated accessibility scans have no critical/serious issues.
- [ ] No user content or files are transmitted during local tool operations.
- [ ] File limits prevent unreasonable memory allocation and errors are recoverable.
- [ ] Downloads have valid bytes, MIME types, extensions, and sanitized meaningful names.
- [ ] Health and finance pages show appropriate near-result disclaimers.
- [ ] Ads are disabled or meet the layout, consent, policy, and labeling requirements.
- [ ] Security headers are present in production and CSP has been tested.
- [ ] No secrets, personal test data, or unlicensed fixtures/assets are committed.

### Tool-family release gates

Calculators:

- [ ] Reference results and boundary cases pass.
- [ ] Formula/method and assumptions are visible.
- [ ] Money/date/unit rounding is consistent and documented.
- [ ] Tables and charts have accessible alternatives.

Text/developer:

- [ ] Unicode behavior is tested.
- [ ] Password and UUID randomness use Web Crypto only.
- [ ] QR outputs decode back to their representative payloads.
- [ ] Copy and download failures are recoverable.

Images:

- [ ] EXIF orientation is correct and metadata is stripped by default.
- [ ] Alpha is preserved or intentionally composited according to selected output.
- [ ] Dimensions, MIME types, batch ZIP, cancellation, and URL cleanup pass.
- [ ] The UI stays responsive for large valid inputs.

PDFs:

- [ ] Outputs reparse and representative pages render.
- [ ] Page count, order, sizes, rotations, and selection syntax are correct.
- [ ] Encrypted/corrupt/oversized files fail cleanly.
- [ ] Raster compression warns about lost capabilities and never misrepresents savings.

Business documents:

- [ ] Totals use decimal-safe math and match in UI, print, and PDF.
- [ ] Long names, addresses, descriptions, notes, and multiple pages do not overlap or clip.
- [ ] Local draft controls and delete behavior work as disclosed.
- [ ] Legal/tax-compliance claims are appropriately limited.

---

## 13. Deployment guidance

### 13.1 Preferred: Vercel

1. Connect the source repository and use the detected Next.js build settings.
2. Select a currently supported Node.js LTS version matching `package.json`.
3. Configure `NEXT_PUBLIC_SITE_URL` separately for production. Do not make preview URLs canonical.
4. Add analytics/ad variables only after privacy and consent review.
5. Attach the custom domain, enforce HTTPS, and redirect all alternate hosts to the canonical host.
6. Confirm security headers and CSP on the deployed response.
7. Run production smoke/E2E checks against the preview, then promote.
8. Enable Web Analytics/Speed Insights or an equivalent privacy-compatible solution if desired.
9. Verify `/robots.txt`, `/sitemap.xml`, canonicals, Open Graph images, 404 responses, workers, and file downloads on the production origin.
10. Submit the sitemap in Google Search Console and monitor indexing, Core Web Vitals, manual actions, security issues, and query performance.

Vercel documents first-class Next.js deployment plus Web Analytics and Speed Insights: [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs).

### 13.2 Alternative static deployment

Because v1 tools operate in the browser, a static deployment can be viable. Enable Next.js `output: 'export'` only after verifying that metadata generation, headers, redirects, image handling, error behavior, and workers work on the chosen host. Configure the host to serve clean routes and the 404 page correctly. Document which security headers are set by the host rather than the app.

Do not adopt static export merely as an optimization; App Router prerendering on Vercel already provides static output for eligible pages while retaining platform capabilities.

### 13.3 CI/CD

- Pull requests: install from frozen lockfile; lint; typecheck; unit/component tests; build; focused E2E; dependency/license check.
- Main branch: full cross-browser E2E, accessibility scans, artifact retention, and production deployment.
- Use preview deployments for review, but set them to noindex and keep them out of analytics datasets where practical.
- Require human review for dependency changes affecting image/PDF parsing, cryptography, analytics, ads, or CSP.
- Keep the previous healthy deployment available for rollback.

### 13.4 Post-deploy verification

Immediately after each production release:

- check home/category/tool pages and one download from each family;
- verify no unexpected network payloads during processing;
- verify sitemap/robots/canonical host;
- inspect error monitoring for worker/CSP failures;
- compare bundle and Web Vitals against the last release;
- confirm preview URLs were not indexed;
- validate analytics contains event names only, not raw tool inputs.

### 13.5 Monitoring and maintenance

- Capture unhandled client errors with privacy filters that remove filenames, entered text, and form state.
- Use synthetic checks for homepage, sitemap, representative tool routes, and a small calculator flow.
- Review dependency updates at least monthly and expedite security fixes for file parsers/renderers.
- Test major browser and Next.js upgrades before production.
- Re-run reference calculations and output-fixture tests whenever formula or encoding code changes.
- Review content and external citations at least twice per year; update review dates only after actual review.
- Use Search Console data to improve existing pages before creating thin keyword variants.

---

## 14. Analytics event contract

All analytics are disabled by default until configured. Allowed event shape:

```ts
type AnalyticsEvent =
  | { name: 'tool_view'; tool: ToolSlug }
  | { name: 'tool_started'; tool: ToolSlug }
  | { name: 'tool_success'; tool: ToolSlug; outputKind?: AllowedOutputKind }
  | { name: 'tool_error'; tool: ToolSlug; code: AllowedErrorCode }
  | { name: 'tool_copy'; tool: ToolSlug }
  | { name: 'tool_download'; tool: ToolSlug; outputKind: AllowedOutputKind }
  | { name: 'related_tool_click'; from: ToolSlug; to: ToolSlug };
```

Forbidden analytics fields include raw input values, pasted text, passwords, UUID output, file/name/path, invoice/receipt/customer/business data, URLs encoded in QR codes, dates of birth, body measurements, exact financial amounts, free-form errors, or document metadata.

Use coarse, predefined error codes such as `unsupported_type`, `too_large`, `decode_failed`, `invalid_input`, `cancelled`, and `out_of_memory_guard`.

---

## 15. Required project documentation

The repository README MUST include:

- product summary and the 30-route list;
- supported browsers and local-processing promise;
- prerequisites, installation, development, test, and production commands;
- environment/configuration reference;
- architecture overview and how to add a tool safely;
- dependency roles and licenses;
- known limitations, especially PDF compression and browser encoding differences;
- deployment steps and post-deploy checks;
- privacy/analytics rules;
- formula/method references;
- troubleshooting for PDF worker paths, CSP, memory limits, and downloads.

Also add:

- `CONTRIBUTING.md` with coding/test/content-review standards;
- `SECURITY.md` with a vulnerability reporting method and no-sensitive-fixtures rule;
- short architecture decision records for local processing, routing/registry, date handling, money math, and PDF compression modes;
- a third-party notices/license report if required by selected dependencies.

---

## 16. Final handoff checklist for the coding agent

Before declaring completion, provide the human owner with:

1. a concise summary of what was built;
2. the exact local setup and verification commands;
3. a table showing all 30 routes and implementation/test status;
4. a list of chosen dependencies and why each is needed;
5. test/build results and any browser-specific differences;
6. Lighthouse/accessibility/privacy-audit summaries;
7. deployment URL and environment variables still requiring owner input;
8. known limitations and explicitly deferred optional items;
9. confirmation that no user tool payload is sent off-device;
10. recommended first-week monitoring actions.

Do not report the project complete with missing tools, hidden stubs, skipped tests, or unresolved production build errors.

---

## Appendix A — Route-to-engine reuse map

| Shared engine | Routes using it |
|---|---|
| Amortization | Loan Calculator, Mortgage Calculator |
| Calendar-date arithmetic | Age Calculator, Date Difference Calculator, amortization dates |
| Numeric/unit formatting | All calculators |
| Unicode segmentation | Word Counter, Character Counter, Case Converter |
| Web Crypto randomness | Password Generator, UUID Generator |
| Image decode/orientation/encode | All seven image tools, Image to PDF, JPG to PDF, business logos |
| Batch queue + ZIP | Image Compressor, JPG Compressor, PNG Compressor, converters, PDF to JPG, PDF Splitter |
| PDF load/page copy/range parse | All six PDF tools |
| PDF rendering | PDF to JPG, raster PDF Compressor, thumbnails |
| PDF assembly | Image to PDF, JPG to PDF, PDF Compressor, Invoice, Receipt |
| Decimal money + line items | Invoice Generator, Receipt Generator |
| Download/object URL lifecycle | Every file-generating tool |

## Appendix B — Browser support baseline

Support the latest two stable major versions of Chrome, Edge, Firefox, and Safari at release time, including current mobile Safari and Chrome for Android. Progressive enhancement is acceptable for optional conveniences such as copying images, but every core tool needs a documented fallback or an explicit unsupported-browser message. Do not silently fall back to server upload.

Feature-detect `crypto.randomUUID`, `Intl.Segmenter`, OffscreenCanvas, image encoding support, clipboard image support, workers, and file APIs. The compatibility layer must be tested rather than inferred from user agent strings.

## Appendix C — Decisions that require owner configuration, not code guesses

The codebase should expose clear placeholders for these values without blocking local development:

- final brand/product name and logo;
- production domain/canonical URL;
- legal entity/contact email and applicable jurisdiction;
- privacy-compatible analytics choice;
- advertising network and consent platform, if/when enabled;
- default currency/locale strategy beyond browser detection;
- support mailbox or contact destination.

Until provided, use neutral development values, disable external analytics/ads, and prevent accidental production deployment with obviously fake legal/contact values.
